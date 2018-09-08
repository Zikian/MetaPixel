window.addEventListener('mouseup', function(e) {
    if(state.active_element == null) { return }
    if(state.active_element.className.includes("resizer")){
        document.body.style.cursor = "default"
    }
    state.tool_handler.current_tool.mouseup_actions();
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

    var prev_mouse = state.mouse_pos.slice();
    state.mouse_pos = [e.clientX, e.clientY];
    state.delta_mouse = [e.clientX - prev_mouse[0], e.clientY - prev_mouse[1]]
    
    var prev_pixel_pos = state.pixel_pos;
    state.pixel_pos = pixel_pos();
    state.delta_pixel_pos = [state.pixel_pos[0] - prev_pixel_pos[0], state.pixel_pos[1] - prev_pixel_pos[1]];

    state.mouse_indicator.style.left = state.pixel_pos[0] * state.zoom + "px";
    state.mouse_indicator.style.top = state.pixel_pos[1] * state.zoom + "px";
    
    if(state.active_element != null){
        state.active_element.active_func();
    }
});

document.addEventListener("keydown", function(event){
    if(document.activeElement.tagName == "INPUT"){ return; }   
    switch(event.keyCode){
        case 8: // BACKSPACE
            state.main_canvas.clear_selection();
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
            state.main_canvas.zoom("in");
            break;
        case 189: // -
            state.main_canvas.zoom("out");
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

state.canvas_area.addEventListener("wheel", function(e){
    if (e.deltaY > 0){ state.main_canvas.zoom("out"); } 
    else { state.main_canvas.zoom("in"); }
})

state.canvas_area.onmousedown = set_active_element;
state.canvas_area.active_func = function(){ state.tool_handler.current_tool.mousemove_actions(); }
state.canvas_wrapper.onmouseout = hide_mouse_indicator;

state.canvas_wrapper.addEventListener("mouseover", function(){
    if (state.tool_handler.current_tool.id != "select" && state.tool_handler.current_tool.id != "hand"){
        state.mouse_indicator.style.display = "block";
    }
    if (state.tool_handler.current_tool.id != "eraser"){
        state.mouse_indicator.style.backgroundColor = state.color_picker.color;
    }
});

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

document.getElementById("sidebar-resizer").onmousedown = set_active_element;
document.getElementById("sidebar-resizer").active_func =  function(){
    document.body.style.cursor = "ew-resize";
    var w = document.body.offsetWidth - event.clientX - 4;
    document.getElementById("sidebar-windows").style.width = clamp(w, 200, 500) + "px";
}

