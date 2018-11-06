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
            tile_painter: new Tile_Painter_Tool("tile_painter"),
            tile_remover: new Tile_Remover_Tool("tile_remover"),
            anim_bounds: new Frame_Setter_Tool("anim_bounds")
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
    mouseleft_actions(){}
    mouseright_actions(){}
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

    mouseleft_actions(){
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
        state.preview_canvas.render();

        state.history_manager.add_history("pen-stroke");
    }
}

class Eraser_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        state.mouse_indicator.style.backgroundColor = rgba([255, 255, 255, 0.5]);
    }

    mouseleft_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        erase_pixel(...state.pixel_pos)
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
    }

    mousedrag_actions(){
        if (state.drawbuffer.length == 2){
            draw_line(...state.drawbuffer[0], ...state.drawbuffer[1], true)
            state.drawbuffer.shift()
            state.canvas_handler.redraw_layers();
            state.canvas_handler.render_drawing();
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke");
        state.preview_canvas.render();
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

    mouseleft_actions(){
        state.history_manager.prev_selection_state = state.selection.get_state();
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();

        var contains_mouse = state.selection.contains_mouse()
        
        if(!contains_mouse){ 
            if(state.selection.transform){
                state.history_manager.prev_copy_data = state.selection.copy_ctx.getImageData(0, 0, state.selection.w, state.selection.h);
                state.selection.commit();
                state.history_manager.add_history("commit-selection");
            } else {
                state.selection.clear();
            }
        } else if (!state.selection.transform && state.input.shift && state.selection.exists) {
            state.selection.prev_selection_w = state.selection.w;
            state.selection.prev_selection_h = state.selection.h;
            state.selection.detach(); 
            state.history_manager.add_history("detach-selection");
        } else if (state.selection.transform && state.input.alt){
            state.selection.paste();
            state.history_manager.add_history("paste-selection");
        }

        state.input.prevent_doubleclick = contains_mouse;
        state.selection.forming = !contains_mouse || !state.selection.exists;
    }
    
    mousedrag_actions(){
        if(state.selection.forming){
            state.input.prevent_doubleclick = true;
            state.selection_end = calc_true_pixel_pos();
            if(state.input.shift){
                state.selection_end = rect_to_square(...state.mouse_start, ...state.selection_end);
            }
            state.selection.draw();
            update_rect_size_preview(state.selection.w, state.selection.h)
        } 
        if (state.selection.exists && state.selection.contains_mouse() && !state.selection.forming || state.selection.being_dragged){
            state.selection.being_dragged = true;
            state.selection.drag();
            state.canvas_handler.render_drawing();
            state.preview_canvas.render();
        }
    }

    mouseup_actions(){
        state.selection_size_element.style.display = "none";
        state.selection.forming = false;
        state.selection.being_dragged = false;

        var prev_selection = JSON.stringify(state.history_manager.prev_selection_state);
        var new_selection = JSON.stringify(state.selection.get_state());
        if(prev_selection == new_selection){ return; }

        if(!state.selection.transform) { 
            state.selection.get_intersection(); 
            state.history_manager.add_history("selection");
        }
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

    mouseleft_actions(){
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

        state.preview_canvas.render();
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();

        state.frame_canvas.render();
    }

    on_exit(){
        state.mouse_indicator.style.width = state.zoom * state.brush_size + "px";
        state.mouse_indicator.style.height = state.zoom * state.brush_size + "px";
    }
}

class Eyedropper_Tool extends Tool{
    constructor(id){ super(id); }

    mouseleft_actions(){
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

    mouseleft_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        update_rect_size_preview(...state.rect_size);
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
        update_rect_size_preview(...state.rect_size);
    }
    
    mouseup_actions(){
        rectangle(...state.mouse_start, ...state.mouse_end);
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_foreground();
        state.preview_canvas.render();
        state.selection_size_element.style.display = "none";
        state.history_manager.add_history("pen-stroke");
    }
}

class Ellipse_Tool extends Tool{
    constructor(id){ 
        super(id); 
    }

    mouseleft_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        update_rect_size_preview(...state.rect_size);
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
        update_rect_size_preview(...state.rect_size);
    }

    mouseup_actions(){
        ellipse(...state.mouse_start, ...state.mouse_end);
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_foreground();
        state.preview_canvas.render();
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

    mouseup_actions(){
        correct_canvas_position();
    }
    
    mousedrag_actions(){
        state.canvas_handler.move_canvas(...state.delta_mouse);
    }

    on_exit(){
        document.body.style.cursor = "default";
        state.mouse_indicator.style.display = "block";
        correct_canvas_position();
    }
}

class Horizontal_Mirror_Tool extends Tool{
    constructor(id){ super(id); }

    mouseleft_actions(){
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
        draw_pixel(state.color_picker.rgba, state.doc_w - state.pixel_pos[0], state.pixel_pos[1]); 
        state.canvas_handler.render_foreground();
    }

    mousedrag_actions(){
        draw_line(...state.drawbuffer[0], ...state.drawbuffer[1])
        var start_x = state.doc_w - state.drawbuffer[0][0];
        var end_x = state.doc_w - state.drawbuffer[1][0];
        draw_line(start_x, state.drawbuffer[0][1], end_x, state.drawbuffer[1][1]);
        state.drawbuffer.shift()
        state.canvas_handler.render_foreground();
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.render();
    }
}

class Vertical_Mirror_Tool extends Tool{
    constructor(id){ super(id); }

    mouseleft_actions(){
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
        state.preview_canvas.render();
    }
}

class Tile_Painter_Tool extends Tool{
    constructor(id) { 
        super(id); 
        this.prev_hovered_tile = [];
    }

    on_enter(){
        if(state.tile_manager.current_tile == null){
            state.tile_manager.current_tile = state.tile_manager.tiles[0]
        }
        if(state.hovered_tile != null){
            state.tile_placer_rect.style.display = "block";
        }
    }
    
    mouseleft_actions(){
        if(state.hovered_tile == null) { return; }
        var prev_index = state.current_layer.tilemap[state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x];
        if(prev_index == state.tile_manager.current_tile.index) { return; }

        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_indices.push(prev_index);
        state.history_manager.prev_tile_positions.push(state.hovered_tile);
        
        state.tile_manager.place_tile(state.tile_manager.current_tile, ...state.hovered_tile);
        paint_tile(state.tile_manager.current_tile, ...state.hovered_tile);

        state.canvas_handler.render_foreground();
    }
    
    mouseright_actions(){
        if(state.hovered_tile == null) { return; }
        var index = state.current_layer.tilemap[state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x];
        if(index == null){
            state.tool_handler.change_tool("tile_remover")
        } else {
            state.tile_manager.change_tile(index);
        }
    }
    
    mousedrag_actions(){
        //Make sure the same tile isn't drawn twice
        if(state.hovered_tile == null) { return; }

        if(this.prev_hovered_tile[0] == state.hovered_tile[0] && this.prev_hovered_tile[1] == state.hovered_tile[1]){ return }

        //Index before the tile was painted
        var prev_index = state.current_layer.tilemap[state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x];
        if(prev_index == state.tile_manager.current_tile.index) { return; }

        state.history_manager.prev_tile_indices.push(prev_index);
        state.history_manager.prev_tile_positions.push(state.hovered_tile);
        
        state.tile_manager.place_tile(state.tile_manager.current_tile, ...state.hovered_tile);
        paint_tile(state.tile_manager.current_tile, ...state.hovered_tile);
        
        state.canvas_handler.render_foreground();
        
        this.prev_hovered_tile = state.hovered_tile;
    }

    mousemove_actions(){
        if(state.hovered_tile == null) { 
            state.tile_placer_rect.style.display = "none";
            return; 
        }
        state.tile_placer_rect.style.display = "block";
        state.tile_placer_rect.style.left = state.tile_w * state.zoom * state.hovered_tile[0] + canvas_x() + "px";
        state.tile_placer_rect.style.top = state.tile_h * state.zoom * state.hovered_tile[1] + canvas_y() + "px";
    }
    
    mouseup_actions(){
        state.preview_canvas.render();
        state.history_manager.add_history("paint-tile", []);
    }

    on_exit(){
        state.tile_placer_rect.style.display = "none";
    }
}

class Tile_Remover_Tool extends Tool{
    constructor(id) { 
        super(id); 
        this.prev_hovered_tile = [];
    }   

    on_enter(){
        if(state.hovered_tile != null){
            state.tile_placer_rect.style.display = "block";
        }
    }

    mouseleft_actions(){
        if(state.hovered_tile == null) { return; }
        var prev_index = state.current_layer.tilemap[state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x];
        if(prev_index == null) { return; }
        
        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_indices.push(prev_index);
        state.history_manager.prev_tile_positions.push(state.hovered_tile);
        
        state.tile_manager.place_tile(state.tile_manager.empty_tile, ...state.hovered_tile);
        paint_tile(state.tile_manager.empty_tile, ...state.hovered_tile);

        state.canvas_handler.render_foreground();
    }
    
    mousedrag_actions(){
        if(state.hovered_tile == null) { return; }
        if(this.prev_hovered_tile[0] == state.hovered_tile[0] && this.prev_hovered_tile[1] == state.hovered_tile[1]){ return }

        var prev_index = state.current_layer.tilemap[state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x];
        if(prev_index == null) { return; }
        
        state.history_manager.prev_tile_indices.push(prev_index);
        state.history_manager.prev_tile_positions.push(state.hovered_tile);
        
        state.tile_manager.place_tile(state.tile_manager.empty_tile, ...state.hovered_tile);
        paint_tile(state.tile_manager.empty_tile, ...state.hovered_tile);

        state.canvas_handler.render_foreground();

        this.prev_hovered_tile = state.hovered_tile;
    }

    mousemove_actions(){
        if(state.hovered_tile == null) { 
            state.tile_placer_rect.style.display = "none";
            return; 
        }
        state.tile_placer_rect.style.display = "block";
        state.tile_placer_rect.style.left = state.tile_w * state.zoom * state.hovered_tile[0] + canvas_x() + "px";
        state.tile_placer_rect.style.top = state.tile_h * state.zoom * state.hovered_tile[1] + canvas_y() + "px";
    }

    mouseup_actions(){
        state.history_manager.add_history("paint-tile", []);
        state.preview_canvas.render();
    }

    on_exit(){
        state.tile_placer_rect.style.display = "none";
    }
}

class Frame_Setter_Tool extends Tool{
    constructor(id) { 
        super(id); 
        this.start_pos = null;
        this.end_pos = null;
    }

    mouseleft_actions(){
        if(!state.hovered_tile || !state.current_anim) { return; }

        state.anim_start_rect.style.left = tile_x(state.hovered_tile[0]) - 1 + "px";
        state.anim_start_rect.style.top = tile_y(state.hovered_tile[1]) - 1.5 + "px";
        state.anim_end_rect.style.left = tile_x(state.hovered_tile[0] + 0.5) + "px";
        state.anim_end_rect.style.top = tile_y(state.hovered_tile[1]) - 1 + "px";
        state.frame_indicator.style.left = tile_x(state.hovered_tile[0]) + "px";
        state.frame_indicator.style.top = tile_y(state.hovered_tile[1]) + "px";
        
        this.start_pos = state.hovered_tile;
        this.end_pos = [this.start_pos[0], this.start_pos[1] + 1];
        state.frame_pos = null;
    }
    
    mousedrag_actions(){
        if(!state.hovered_tile || !state.current_anim){ return; } 
        if(!this.start_pos) { this.mouseleft_actions(); }
        if(state.hovered_tile[0] + state.hovered_tile[1] * state.tiles_x >= this.start_pos[0] + this.start_pos[1] * state.tiles_x){
            state.anim_end_rect.style.left = tile_x(state.hovered_tile[0] + 0.5) + "px";
            state.anim_end_rect.style.top = tile_y(state.hovered_tile[1]) - 1 + "px";
            this.end_pos = state.hovered_tile;
        }
    }

    mouseup_actions(){
        if(!this.start_pos){ return; }
        var start_index = this.start_pos[0] + this.start_pos[1] * state.tiles_x;
        var end_index = this.end_pos[0] + this.end_pos[1] * state.tiles_x
        state.current_anim.populate_frames(start_index, end_index - start_index + 1);
        state.current_anim.update_frame_pos();
        state.frame_canvas.render()
        this.start_pos = null;
    }
}