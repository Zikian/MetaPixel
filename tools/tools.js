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
            tile_placer: new Tile_Placer_Tool("tile_placer")
        }
        
        this.current_tool = this.tools.drawtool;
        this.change_tool("drawtool")
    }   

    change_tool(tool_id){
        if(tool_id != this.current_tool.id){
            this.prev_tool = this.current_tool;
            this.prev_tool.on_exit();
            this.set_inactive_styles(this.prev_tool)
        }
        this.current_tool = this.tools[tool_id];
        this.current_tool.on_enter();
        this.set_active_styles(this.current_tool);
    }

    set_active_styles(tool){
        tool.elem.style.boxShadow = "0px 0px 0px 3px yellow inset";
    }

    set_inactive_styles(tool){
        tool.elem.style.boxShadow = "none";
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
    mouseup_actions(){}
    on_exit(){}
}

class Draw_Tool extends Tool{
    constructor(id){ 
        super(id); 
        this.draw_type = "draw"; // free draw or line
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        if(state.input.shift) { this.draw_type = "line" }
        else { this.draw_type = "draw"; }
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
    }

    mousemove_actions(){
        if (this.draw_type == "draw"){
            state.draw_buffer.push(state.pixel_pos);
            if (state.draw_buffer.length == 2){
                draw_line(...state.draw_buffer[0], ...state.draw_buffer[1])
                state.draw_buffer.shift()
            }
        } else {
            state.overlay_canvas.clear();
            state.overlay_canvas.draw_line(...state.mouse_start, ...state.mouse_end);
        }
    }

    mouseup_actions(){
        state.draw_buffer = [];
        if(this.draw_type == "line"){
            draw_line(...state.mouse_start, ...state.mouse_end)
        }
        if(!state.input.shift) { this.draw_type = "draw"; }
        state.overlay_canvas.clear();
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
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        erase_pixel(...state.pixel_pos)
    }

    mousemove_actions(){
        state.draw_buffer.push(state.pixel_pos);
        if (state.draw_buffer.length == 2){
            draw_line(...state.draw_buffer[0], ...state.draw_buffer[1], true)
            state.draw_buffer.shift()
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke");
        state.draw_buffer = [];
        state.preview_canvas.redraw();
    }

    on_exit(){
        state.mouse_indicator.style.backgroundColor = state.color_picker.color;
    }
}

class Selection_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        hide_mouse_indicator();
        document.body.style.cursor = "crosshair";
    }

    mousedown_actions(){
        state.history_manager.prev_selection = state.selection.get_selection_info();
        state.selection_start = calc_true_pixel_pos();
        if(state.active_element == state.editor && !state.selection.contains_pixel(...state.pixel_pos)){
            state.selection.clear();
        }
        if (!state.selection.contains_pixel(...state.pixel_pos) || !state.selection.exists){
            state.selection.forming = true;
        }
    }
    
    mousemove_actions(){
        if(state.selection.forming){
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
        state.history_manager.new_selection = state.selection.get_selection_info();
        state.history_manager.add_history("selection")
        state.overlay_canvas.move();
        state.overlay_canvas.resize();
    }

    on_exit(){
        document.body.style.cursor = "default";
        state.mouse_indicator.style.display = "block";
        state.mouse_indicator.style.backgroundColor = state.color_picker.color;
    }
}

class Fill_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        var current_layer = state.layer_manager.current_layer;
        state.history_manager.prev_data = current_layer.render_canvas.toDataURL();
        var old_color = current_layer.render_ctx.getImageData(state.pixel_pos[0], state.pixel_pos[1], 1, 1).data;
        current_layer.render_ctx.fillStyle = state.color_picker.rgba;
        current_layer.fill(...state.pixel_pos, state.color_picker.rgba, old_color);
        state.preview_canvas.redraw();
        state.history_manager.add_history("pen-stroke");
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
    
    mousemove_actions(){
        state.color_picker.update_color("eyedropper");
    }

    mouseup_actions(){
        state.eyedropper_ctx.clearRect(0, 0, state.canvas_handler.w, state.canvas_handler.h);
    }
}

class Rectangle_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }
    
    mousemove_actions(){
        state.overlay_canvas.clear();
        if(state.input.shift) { 
            state.mouse_end = rect_to_square(...state.mouse_start, ...state.mouse_end)
            state.overlay_canvas.rectangle(...state.mouse_start, ...state.mouse_end);
        } else { 
            state.overlay_canvas.rectangle(...state.mouse_start, ...state.mouse_end);
        }
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }
    
    mouseup_actions(){
        state.overlay_canvas.clear();
        state.preview_canvas.redraw();
        rectangle(...state.mouse_start, ...state.mouse_end);
        state.selection_size_element.style.display = "none";
        state.history_manager.add_history("pen-stroke");
    }
}

class Ellipse_Tool extends Tool{
    constructor(id){ 
        super(id); 
    }

    mousedown_actions(){
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }

    mousemove_actions(){
        state.overlay_canvas.clear();
        if(state.input.shift) { 
            state.mouse_end = rect_to_square(...state.mouse_start, ...state.mouse_end)
            state.overlay_canvas.ellipse(...state.mouse_start, ...state.mouse_end);
        } else { 
            state.overlay_canvas.ellipse(...state.mouse_start, ...state.mouse_end);
        }
        var w = calc_distance(state.mouse_start[0], state.mouse_end[0]);
        var h = calc_distance(state.mouse_start[1], state.mouse_end[1]);
        update_rect_size_preview(w, h);
    }

    mouseup_actions(){
        state.overlay_canvas.clear();
        state.preview_canvas.redraw();
        ellipse(...state.mouse_start, ...state.mouse_end);
        state.selection_size_element.style.display = "none";
        if(!state.input.shift) { this.draw_type = "ellipse"}
        state.history_manager.add_history("pen-stroke");
    }
}

class Hand_Tool extends Tool{
    constructor(id){ super(id); }

    on_enter(){
        document.body.style.cursor = "grab";
        hide_mouse_indicator();
    }
    
    mousemove_actions(){
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
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
        draw_pixel(state.color_picker.rgba, state.canvas_handler.w - state.pixel_pos[0], state.pixel_pos[1]); 
    }

    mousemove_actions(){
        state.draw_buffer.push(state.pixel_pos);
        if (state.draw_buffer.length == 2){
            draw_line(...state.draw_buffer[0], ...state.draw_buffer[1])
            var start_x = state.canvas_handler.w - state.draw_buffer[0][0];
            var end_x = state.canvas_handler.w - state.draw_buffer[1][0];
            draw_line(start_x, state.draw_buffer[0][1], end_x, state.draw_buffer[1][1]);
            state.draw_buffer.shift()
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke")
        state.draw_buffer = [];
        state.preview_canvas.redraw();
    }
}

class Vertical_Mirror_Tool extends Tool{
    constructor(id){ super(id); }

    mousedown_actions(){
        state.history_manager.prev_data = state.layer_manager.current_layer.render_canvas.toDataURL();
        draw_pixel(state.color_picker.rgba, ...state.pixel_pos); 
        draw_pixel(state.color_picker.rgba, state.pixel_pos[0], state.canvas_handler.h - state.pixel_pos[1]); 
    }

    mousemove_actions(){
        state.draw_buffer.push(state.pixel_pos);
        if (state.draw_buffer.length == 2){
            draw_line(...state.draw_buffer[0], ...state.draw_buffer[1])
            var start_y = state.canvas_handler.h - state.draw_buffer[0][1];
            var end_y = state.canvas_handler.h - state.draw_buffer[1][1];
            draw_line(state.draw_buffer[0][0], start_y, state.draw_buffer[1][0], end_y);
            state.draw_buffer.shift()
        }
    }

    mouseup_actions(){
        state.history_manager.add_history("pen-stroke")
        state.draw_buffer = [];
        state.preview_canvas.redraw();
    }
}

class Tile_Placer_Tool extends Tool{
    constructor(id) { 
        super(id); 
    }

    on_enter(){
    }

    mousemove_actions(){
        var hovered_tile = state.tile_manager.get_hovered_tile()
    }

    on_exit(){
    }
}