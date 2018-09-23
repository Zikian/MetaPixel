class Tool_Handler{
    constructor(){ 
        this.switch_colors_button = document.getElementById("switch-colors-button");
        this.reset_colors_button = document.getElementById("reset-colors-button");

        this.switch_colors_button.onclick = function(){
            state.color_picker.update_color("switch-colors");
        }
        
        this.reset_colors_button.onclick = function(){
            state.color_picker.update_color("reset-colors");
        }

        this.tools = {
            drawtool: new Draw_Tool("drawtool"),
            eraser: new Eraser_Tool("eraser"),
            select: new Selection_Tool("select"),
            fill: new Fill_Tool("fill"),
            eyedropper: new Eyedropper_Tool("eyedropper"),
            rectangle: new Rectangle_Tool("rectangle"),
            ellipse: new Ellipse_Tool("ellipse"),
            hand: new Hand_Tool("hand"),
            mirrorx: new Horizontal_Mirror_Tool("mirrorx"),
            mirrory: new Vertical_Mirror_Tool("mirrory"),
            tile_painter: new Tile_painter_Tool("tile_painter")
        }
        
        this.current_tool = this.tools.drawtool;
        this.change_tool("drawtool")
    }   

    change_tool(tool_id){
        if(tool_id != this.current_tool.id){
            this.prev_tool = this.current_tool;
            this.prev_tool.on_exit();
            this.prev_tool.elem.style.boxShadow = "none"
        }
        this.current_tool = this.tools[tool_id];
        this.current_tool.on_enter();
        this.current_tool.elem.style.boxShadow = "0px 0px 0px 3px yellow inset";
    }
}

class Tool{
    constructor(id){ 
        this.id = id;
        this.elem = document.getElementById(id); 
        this.elem.onmouseover = function(){
            if(state.tool_handler.current_tool.elem != this){
                this.style.backgroundColor = "rgb(116, 116, 124)";
            }
        }
        this.elem.onmouseout = function(){
            this.style.backgroundColor = "transparent";
        }
        this.elem.onclick = function(){
            state.tool_handler.change_tool(this.id);
            this.style.backgroundColor = "transparent";
        }
    }
    on_enter(){}
    mousedown_actions(){}
    mousemove_actions(){}
    mousedrag_actions(){}
    mouseup_actions(){}
    on_exit(){}
}

class Draw_Tool extends Tool{
    constructor(id){ 
        super(id); 
        this.draw_type = "draw"; // free draw or line
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        if(state.input.shift) { this.draw_type = "line" }
        else {
            draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
            this.draw_type = "draw"; 
            state.canvas_handler.render_foreground();
        }
    }

    mousedrag_actions(){
        if (this.draw_type == "draw"){
            if (state.drawbuffer.length == 2){
                draw_line(...state.drawbuffer[0], ...state.drawbuffer[1])
                state.drawbuffer.shift()
            }
        } else {
            state.canvas_handler.render_background();
            preview_line(...state.mouse_start, ...state.mouse_end);
        }
        state.canvas_handler.render_foreground();
    }

    mouseup_actions(){
        if(this.draw_type == "line"){
            draw_line(...state.mouse_start, ...state.mouse_end)
            state.canvas_handler.render_foreground();
        }

        state.canvas_handler.redraw_layers();
        state.preview_canvas.redraw();

        state.history_manager.add_history("pen-stroke");
    }
}

class Eraser_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        state.mouse_indicator.style.backgroundColor = rgba([255, 255, 255, 0.5]);
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        erase_pixel(...state.pixel_pos)
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
    }

    mousedrag_actions(){
        if (state.drawbuffer.length == 2){
            draw_line(...state.drawbuffer[0], ...state.drawbuffer[1], true)
            state.drawbuffer.shift()
            state.canvas_handler.redraw_layers();
            state.canvas_handler.render_draw_canvas();
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke");
        state.preview_canvas.redraw();
    }

    on_exit(){
        state.mouse_indicator.style.backgroundColor = state.color_picker.color;
    }
}

class Selection_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        state.mouse_indicator.style.display = "none";
        document.body.style.cursor = "crosshair";
    }

    mousedown_actions(){
        state.history_manager.prev_selection_state = state.selection.get_state();
        state.selection_start = calc_true_pixel_pos();
        if(state.active_element == state.editor && !state.selection.contains_pixel(...state.pixel_pos)){
            state.selection.prevent_doubleclick = false;
            state.selection.clear();
        }
        if (!state.selection.contains_pixel(...state.pixel_pos) || !state.selection.exists){
            state.selection.forming = true;
        }
    }
    
    mousedrag_actions(){
        if(state.selection.forming){
            state.selection.prevent_doubleclick = true;
            state.selection_end = calc_true_pixel_pos()
            state.selection.draw();
            var w = calc_distance(state.selection_start[0], state.selection_end[0]);
            var h = calc_distance(state.selection_start[1], state.selection_end[1]);
            update_rect_size_preview(w, h)
        } 
        if (state.selection.exists && state.selection.contains_pixel(...state.pixel_pos) && !state.selection.forming || state.selection.being_dragged){
            state.selection.being_dragged = true;
            state.selection.drag();
        }
    }

    mouseup_actions(){
        state.selection_size_element.style.display = "none";
        state.selection.forming = false;
        state.selection.being_dragged = false;
        state.selection.get_intersection();
        state.history_manager.add_history("selection")
    }

    on_exit(){
        document.body.style.cursor = "default";
        state.mouse_indicator.style.backgroundColor = state.color_picker.color;
        state.mouse_indicator.style.display = "block";
    }
}

class Fill_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        state.mouse_indicator.style.width = state.zoom + "px";
        state.mouse_indicator.style.height = state.zoom + "px";
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();

        var old_color = state.current_layer.render_ctx.getImageData(state.pixel_pos[0], state.pixel_pos[1], 1, 1).data;
        state.current_layer.render_ctx.fillStyle = state.color_picker.color;
        fill(...state.pixel_pos, state.color_picker.rgba, old_color);

        state.tile_manager.tiles.forEach(tile => {
            var i = tile.painted_positions.length;
            while(i--){
                var position = tile.painted_positions[i];
                paint_tile(tile, ...position);
            }
        })

        state.history_manager.add_history("pen-stroke");

        state.preview_canvas.redraw();
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
    }

    on_exit(){
        state.mouse_indicator.style.width = state.zoom * state.brush_size + "px";
        state.mouse_indicator.style.height = state.zoom * state.brush_size + "px";
    }
}

class Eyedropper_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        for(var i = state.layer_manager.layers.length - 1; i >= 0; i--){
            state.eyedropper_ctx.drawImage(state.layer_manager.layers[i].render_canvas, 0, 0)
        }
        state.color_picker.update_color("eyedropper");
    }
    
    mousedrag_actions(){
        state.color_picker.update_color("eyedropper");
    }

    mouseup_actions(){
        state.eyedropper_ctx.clearRect(0, 0, state.doc_w, state.doc_h);
    }
}

class Rectangle_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }
    
    mousedrag_actions(){
        state.canvas_handler.render_background();
        if(state.input.shift) { 
            state.mouse_end = rect_to_square(...state.mouse_start, ...state.mouse_end)
            preview_rectangle(...state.mouse_start, ...state.mouse_end);
        } else { 
            preview_rectangle(...state.mouse_start, ...state.mouse_end);
        }
        state.canvas_handler.render_foreground();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }
    
    mouseup_actions(){
        rectangle(...state.mouse_start, ...state.mouse_end);
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_foreground();
        state.preview_canvas.redraw();
        state.selection_size_element.style.display = "none";
        state.history_manager.add_history("pen-stroke");
    }
}

class Ellipse_Tool extends Tool{
    constructor(id){ 
        super(id); 
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }

    mousedrag_actions(){
        state.canvas_handler.render_background();
        if(state.input.shift) { 
            state.mouse_end = rect_to_square(...state.mouse_start, ...state.mouse_end)
            preview_ellipse(...state.mouse_start, ...state.mouse_end);
        } else { 
            preview_ellipse(...state.mouse_start, ...state.mouse_end);
        }
        state.canvas_handler.render_foreground();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }

    mouseup_actions(){
        ellipse(...state.mouse_start, ...state.mouse_end);
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_foreground();
        state.preview_canvas.redraw();
        state.selection_size_element.style.display = "none";
        if(!state.input.shift) { this.draw_type = "ellipse"}
        state.history_manager.add_history("pen-stroke");
    }
}

class Hand_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        state.mouse_indicator.style.display = "none";
        document.body.style.cursor = "grab";
    }
    
    mousedrag_actions(){
        state.canvas_handler.move_canvas(...state.delta_mouse);
    }

    on_exit(){
        document.body.style.cursor = "default";
        state.mouse_indicator.style.display = "block";
    }
}

class Horizontal_Mirror_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
        draw_pixel(state.color_picker.rgba, state.doc_w - state.pixel_pos[0], state.pixel_pos[1]); 
        state.canvas_handler.render_foreground();
    }

    mousedrag_actions(){
        if (state.drawbuffer.length == 2){
            draw_line(...state.drawbuffer[0], ...state.drawbuffer[1])
            var start_x = state.doc_w - state.drawbuffer[0][0];
            var end_x = state.doc_w - state.drawbuffer[1][0];
            draw_line(start_x, state.drawbuffer[0][1], end_x, state.drawbuffer[1][1]);
            state.drawbuffer.shift()
            state.canvas_handler.render_foreground();
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
    }
}

class Vertical_Mirror_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
        draw_pixel(state.color_picker.rgba, state.pixel_pos[0], state.doc_h - state.pixel_pos[1]); 
        state.canvas_handler.render_foreground();
    }

    mousedrag_actions(){
        if (state.drawbuffer.length == 2){
            draw_line(...state.drawbuffer[0], ...state.drawbuffer[1])
            var start_y = state.doc_h - state.drawbuffer[0][1];
            var end_y = state.doc_h - state.drawbuffer[1][1];
            draw_line(state.drawbuffer[0][0], start_y, state.drawbuffer[1][0], end_y);
            state.drawbuffer.shift()
            state.canvas_handler.render_foreground();
        }
    }

    mouseup_actions(){  
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
    }
}

class Tile_painter_Tool extends Tool{
    constructor(id) { 
        super(id); 
        this.prev_hovered_tile = {x: 0, y: 0};
    }

    on_enter(){
        if(state.tile_manager.current_tile == null){
            state.tile_manager.current_tile = state.tile_manager.tiles[0]
        }
    }

    mousedown_actions(){
        var x = state.hovered_tile.x;
        var y = state.hovered_tile.y;
        if(x == null || y == null) { return; }
        
        state.history_manager.prev_data = state.current_layer.get_data();
        var prev_index = state.current_layer.painted_tiles[x][y];

        state.tile_manager.place_tile(state.tile_manager.current_tile, x, y);

        paint_tile(state.tile_manager.current_tile, x, y);

        state.canvas_handler.render_foreground();
        state.preview_canvas.redraw();
        
        state.history_manager.add_history("paint-tile", [[x, y], prev_index]);
    }
    
    mousedrag_actions(){
        if(this.prev_hovered_tile[0] != state.hovered_tile.x && this.prev_hovered_tile[1] != state.hovered_tile.y){
            this.mousedown_actions();
        }
        this.prev_hovered_tile = state.tile_manager.get_containing_tile(...state.pixel_pos);
    }
}