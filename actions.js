window.addEventListener('mouseup', function(e) {
    state.drawbuffer = [];

    if(state.active_element == state.editor || state.active_element == state.frame_canvas.wrapper){
        state.tool_handler.current_tool.mouseup_actions();
    }

    if (state.active_element.className == "tile") {
        var index_a = state.active_element.owner_tile_index;
        var index_b = state.tile_manager.get_target_swap_tile(event.clientX, event.clientY)
        state.tile_manager.swap_tiles(index_a, index_b);
        state.history_manager.add_history("swap-tiles", [index_a, index_b]);
    } else if(state.active_element.className.includes("resizer")){
        document.body.style.cursor = "default"
    } else if(state.active_element == state.frame_canvas.wrapper && state.tool_handler.current_tool.id != "select"){
        state.selection.restore()
    }
    
    state.active_element = state.null_active_element;
    state.mouse_indicator.style.display = "block";
}, false);

window.addEventListener('mousedown', function(e) {
    if (state.active_element == state.frame_canvas.wrapper) {
        pixel_pos_from_frame();
    }

    if(state.active_element != state.editor && state.active_element != state.frame_canvas.wrapper) { return; }

    // Right Click
    if(e.button == 2){
        state.tool_handler.current_tool.mouseright_actions();
    } 
    // Left Click
    else if (e.button == 0){
        state.drawbuffer.push(state.pixel_pos);
        state.mouse_start = state.pixel_pos;
        state.mouse_end = state.mouse_start;
        state.rect_size = [0, 0];
        state.selection_start = calc_true_pixel_pos();
        state.tool_handler.current_tool.mouseleft_actions();
    }

    state.mouse_indicator.style.display = "none";
}, false);

window.addEventListener("mousemove", function(e){
    state.hovered_tile = state.tile_manager.get_containing_tile(...state.pixel_pos);

    state.delta_mouse = [e.clientX - state.mouse_pos[0], e.clientY - state.mouse_pos[1]]
    state.mouse_pos = [e.clientX, e.clientY];
    
    var prev_pixel_pos = state.pixel_pos;
    state.pixel_pos = calc_pixel_pos();
    
    state.frame_pixel_pos = calc_frame_pixel_pos();
    state.frame_canvas.update_mouse_indicator();  
    
    if(state.active_element == state.frame_canvas.wrapper) {
        pixel_pos_from_frame();
    }
    state.delta_pixel_pos = [state.pixel_pos[0] - prev_pixel_pos[0], state.pixel_pos[1] - prev_pixel_pos[1]];

    if(state.frame_canvas.contains_mouse()){
        mouse_indicator_from_anim_frame();
    } else {
        update_mouse_indicator();
        frame_mouse_indicator_from_anim_frame();
    }

    state.mouse_end = state.pixel_pos;
    state.rect_size = [Math.abs(state.mouse_start[0] - state.mouse_end[0]), Math.abs(state.mouse_start[1] - state.mouse_end[1])]

    //Calls the function attached to the element that is being dragged
    state.active_element.mousedrag_actions();

    state.tool_handler.current_tool.mousemove_actions();

    state.pixel_pos_info.innerHTML = `X: ${state.pixel_pos[0]} Y: ${state.pixel_pos[1]}`;
});

document.addEventListener("keydown", function(event){
    if(document.activeElement.tagName == "INPUT"){ return; }   
    switch(event.keyCode){
        case 8: // BACKSPACE
            if(!state.selection.exists){ return; }
            clear_selection_contents();
            break;
        case 32: // SPACE
            if(state.input.space) { return; }
            state.input.space = true;
            state.tool_handler.change_tool("hand");
            break;
        case 17: // CTRL
            state.input.ctrl = true;
            break;
        case 18: // ALT
            state.tool_handler.change_tool("eyedropper");
            break;
        case 67: // C
            state.color_picker.old_color = state.color_picker.rgb;
            state.color_picker.old_alpha = state.color_picker.alpha;
            state.color_picker.toggle_display();
            state.color_picker.old_color_rect.style.backgroundColor = state.color_picker.color;
            break;
        case 68: // D
            state.tool_handler.change_tool("drawtool");
            break;
        case 69: // E
            state.tool_handler.change_tool("eraser");
            break;
        case 70: // F
            state.tool_handler.change_tool("fill");
            break;
        case 81: // Q
            state.tool_handler.change_tool("ellipse")
            break;
        case 82: // R
            state.tool_handler.change_tool("rectangle")
            break;
        case 83: // S
            state.tool_handler.change_tool("select");
            break;
        case 88: // X
            state.color_picker.update_color("switch-colors");
            break;
        case 90: // Z
            if (state.input.ctrl && !state.input.shift){
                state.history_manager.undo_last();
            }
            if (state.input.ctrl && state.input.shift){
                state.history_manager.redo_last();
            }
            break;
        case 187: // +
            state.canvas_handler.zoom("in");
            break;
        case 189: // -
            state.canvas_handler.zoom("out");
            break;
        case 16: // SHIFT
            state.input.shift = true;
            if (state.input.ctrl){
                state.input.last_shortcut = "ctrl-shift";
            }
            break;
    }
})

document.addEventListener("keyup", function(event){
    switch (event.keyCode){
        case 32: // SPACE
            state.input.space = false;
            if(state.tool_handler.prev_tool.id != "select"){
                state.tool_handler.change_tool(state.tool_handler.prev_tool.elem.id);
                correct_canvas_position();
            }
            break;
        case 18: // ALT
            if(state.tool_handler.prev_tool.id != "select"){
                state.tool_handler.change_tool(state.tool_handler.prev_tool.elem.id);
            }
            break;
        case 16: // SHIFT
            state.input.shift = false;
            state.input.last_shortcut = null;
            break;
        case 17: // CTRL
            state.input.ctrl = false;
    }
})

state.editor.addEventListener("wheel", function(e){
    if (e.deltaY > 0){ state.canvas_handler.zoom("out"); } 
    else { state.canvas_handler.zoom("in"); }
})

state.editor.onmousedown = set_active_element;
state.editor.mousedrag_actions = function(){ 
    state.drawbuffer.push(state.pixel_pos);
    state.tool_handler.current_tool.mousedrag_actions(); 
}

state.editor.addEventListener("dblclick",  function(){
    if(state.tool_handler.current_tool.id == "select" && !state.input.prevent_doubleclick){
        state.history_manager.prev_selection_state = state.selection.get_state();
        var x1 = state.hovered_tile[0] * state.tile_w;
        var y1 = state.hovered_tile[1] * state.tile_h;
        state.selection.draw_selection(x1, y1, state.tile_w, state.tile_w);
        state.history_manager.add_history("selection")
    }
})

document.getElementById("primary-color-rect").onmousedown = function(){
    state.color_picker.window.style.display = "grid";
    state.color_picker.selected_color = "primary";
    state.color_picker.update_color("to-foreground");
}

document.getElementById("secondary-color-rect").onmousedown = function(){
    state.color_picker.window.style.display = "grid"
    state.color_picker.selected_color = "secondary";
    state.color_picker.update_color("to-background");
}

document.getElementById("sidebar-right-resizer").onmousedown = set_active_element;
document.getElementById("sidebar-right-resizer").mousedrag_actions =  function(){
    document.body.style.cursor = "ew-resize";
    var w = document.body.offsetWidth - event.clientX - 4;
    document.getElementById("sidebar-windows").style.width = clamp(w, 200, 500) + "px";
    state.canvas_handler.move_canvas(0, 0); //Reset canvas clip because editor is resized
    state.preview_canvas.update_visible_rect();
}

window.onresize = function(){
    state.canvas_handler.move_canvas(0, 0); //Reset canvas clip because editor is resized
}
