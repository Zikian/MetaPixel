function setup(){
    state.main_canvas.clear();
    resize_mouse_indicator();
    resize_canvas_wrapper();
    state.canvas_wrapper.style.left = (state.canvas_area.offsetWidth - state.canvas_wrapper.clientWidth)/2 + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.offsetHeight - state.canvas_wrapper.clientHeight)/2 + "px";
    if (!state.transparency){
        state.main_canvas.ctx.beginPath();
        state.main_canvas.ctx.rect(0, 0, state.main_canvas.canvas.width, state.main_canvas.canvas.height);
        state.main_canvas.ctx.fillStyle = "white";
        state.main_canvas.ctx.fill();
    }
    state.tool_handler.change_tool("drawtool");
    state.color_picker.update_color();
    state.current_selection = new Selection();
}
setup();

window.addEventListener('mouseup', function(e) {
    mouse_up_functions.forEach(function(element){
        element();
    });
    if(state.active_element == state.canvas_area || state.active_element == state.canvas_wrapper){
        state.tool_handler.current_tool.mouseup_actions();
    }
    state.active_element = null;
}, false);

window.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    state.mouse_start = state.pixel_pos;
    if(state.active_element == state.canvas_area || state.active_element == state.canvas_wrapper){
        state.tool_handler.current_tool.mousedown_actions();
    }
}, false);

window.addEventListener("mousemove", function(e){
    pauseEvent(e);

    var prev_abs_mouse_pos = state.abs_mouse_pos.slice();
    state.abs_mouse_pos = [e.pageX, e.pageY];
    state.delta_mouse = [state.abs_mouse_pos[0] - prev_abs_mouse_pos[0], state.abs_mouse_pos[1] - prev_abs_mouse_pos[1]]
    
    var prev_pixel_pos = state.pixel_pos
    state.pixel_pos = pixel_pos();
    state.delta_pixel_pos = [state.pixel_pos[0] - prev_pixel_pos[0], state.pixel_pos[1] - prev_pixel_pos[1]];

    if (state.main_canvas.contains_mouse()){
        state.mouse_indicator.style.left = state.pixel_pos[0] * state.main_canvas.current_zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * state.main_canvas.current_zoom + "px";
    }

    switch(state.active_element){
        case state.color_picker.header:
            drag_element(state.color_picker.window,  state.delta_mouse);
            state.color_picker.window.style.top = clamp(state.color_picker.window.offsetTop, state.canvas_area.getBoundingClientRect().y, window.innerHeight) + "px";
            break;
        case state.new_document_panel.header:
            drag_element(state.new_document_panel.panel, state.delta_mouse);
            break;
        case state.canvas_area:
            state.tool_handler.current_tool.mousemove_actions();
            break;
    }

    mouse_move_functions.forEach(function(element) {
        element();
    });
});

document.addEventListener("keydown", function(event){
    if(document.activeElement.tagName == "INPUT"){
        return;
    }   
    switch(event.keyCode){
        case 8: // BACKSPACE
            state.main_canvas.clear_selection();
            break;
        case 32: // SPACE
            state.tool_handler.change_tool("hand");
            break;
        case 17: // CTRL
            state.input.ctrl = true;
            break;
        case 18: // ALT
            state.tool_handler.change_tool("eyedropper");
            break;
        case 67: // C
            state.color_picker.old_color = state.color_picker.current_rgb;
            state.color_picker.old_alpha = state.color_picker.current_alpha;
            state.color_picker.toggle_display();
            state.color_picker.old_color_rect.style.backgroundColor = state.color_picker.current_color;
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
            state.main_canvas.zoom("in");
            break;
        case 189: // -
            state.main_canvas.zoom("out");
            break;
        case 16: // SHIFT
            state.input.shift = true;
            if (!state.input.ctrl){
                state.tool_handler.change_tool("line");
            } else {
                state.input.last_shortcut = "ctrl-shift";
            }
            break;
    }
})

document.addEventListener("keyup", function(event){
    switch (event.keyCode){
        case 32: // SPACE
            if(state.tool_handler.prev_tool.id != "select"){
                state.tool_handler.change_tool(state.tool_handler.prev_tool.id);
            }
            break;
        case 18: // ALT
            if(state.tool_handler.prev_tool.id != "select"){
                state.tool_handler.change_tool(state.tool_handler.prev_tool.id);
            }
            break;
        case 16: // SHIFT
            state.input.shift = false;
            if(state.input.last_shortcut != "ctrl-shift" && state.tool_handler.prev_tool.id != "select"){
                state.tool_handler.change_tool(state.tool_handler.prev_tool.id);
            }
            state.input.last_shortcut = null;
            break;
        case 17: // CTRL
            state.input.ctrl = false;
        
    }
})

state.canvas_area.addEventListener("wheel", function(e){
    if (e.deltaY > 0){
        state.main_canvas.zoom("out");
    } else {
        state.main_canvas.zoom("in");
    }
})

state.canvas_area.onmousedown = function(){
    state.active_element = state.canvas_area;
}

state.canvas_wrapper.onmouseout = function(){
    state.mouse_indicator.style.display = "none";
}

state.canvas_wrapper.onmouseover = function(){
    state.mouse_indicator.style.display = "block";
    if (state.tool_handler.current_tool.id != "eraser"){
        state.mouse_indicator.style.backgroundColor = state.color_picker.current_color;
    }
}

state.switch_colors_button.onclick = function(){
    state.color_picker.update_color("switch-colors");
}

state.reset_colors_button.onclick = function(){
    state.color_picker.update_color("reset-colors");
}

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

state.undo.onclick = function(){
    state.history_manager.undo_last();
}

state.redo.onclick = function(){
    state.history_manager.redo_last();
}