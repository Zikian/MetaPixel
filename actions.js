function setup(){
    state.main_canvas.clear();
    state.line_canvas = new Canvas(line_canvas, state.main_canvas.w, state.main_canvas.h)
    update_mouse_indicator();
    update_canvas_wrapper();
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
}
setup();

state.canvas_wrapper.addEventListener("mouseup", function(){
    state.tool_handler.current_tool.mouseup_actions();
});

window.addEventListener('mouseup', function(e) {
    mouse_up_functions.forEach(function(element){
        element();
    });
    state.active_element = null;
}, false);

window.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    state.mouse_start = state.pixel_pos;

    if(state.active_element == state.canvas_wrapper && !state.input.space){
        state.tool_handler.current_tool.mousedown_actions();
    }  
}, false);

window.addEventListener("mousemove", function(e){
    pauseEvent(e);

    var prev_abs_mouse_pos = state.abs_mouse_pos.slice();
    state.abs_mouse_pos = [e.pageX, e.pageY];
    var delta_mouse_pos = [state.abs_mouse_pos[0] - prev_abs_mouse_pos[0], state.abs_mouse_pos[1] - prev_abs_mouse_pos[1]]
    
    state.pixel_pos = pixel_pos();

    state.mouse_indicator.style.left = state.pixel_pos[0] * state.main_canvas.current_zoom + "px";
    state.mouse_indicator.style.top = state.pixel_pos[1] * state.main_canvas.current_zoom + "px";

    if(state.mouse_over_canvas_area && state.input.space){
        drag_element(state.canvas_wrapper, delta_mouse_pos);
    }

    switch(state.active_element){
        case state.color_picker.header:
            drag_element(state.color_picker.window,  delta_mouse_pos);
            state.color_picker.window.style.top = clamp(state.color_picker.window.offsetTop, state.canvas_area.getBoundingClientRect().y, window.innerHeight) + "px";
            break;
        case state.new_document_panel.header:
            drag_element(state.new_document_panel.panel, delta_mouse_pos);
            break;
        case state.canvas_wrapper:
            if (!state.input.space){
                state.tool_handler.current_tool.mousemove_actions();
            }
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
        case 32: // SPACE
            if(state.mouse_over_canvas_area){
                document.body.style.cursor = "grab";
            }
            state.input.space = true;
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
        case 71: // G
            state.tool_handler.change_tool("line");
            break;
        case 83: // S
            state.tool_handler.change_tool("select");
            break;
        case 88: // X
            state.color_picker.update_color("switch-colors");
            break;
        case 187: // +
            state.main_canvas.zoom("in");
            state.line_canvas.zoom("in");
            update_mouse_indicator();
            update_canvas_wrapper();
            break;
        case 189: // -
            state.main_canvas.zoom("out");
            state.line_canvas.zoom("out");
            update_mouse_indicator();
            update_canvas_wrapper();
            break;
    }
})

document.addEventListener("keyup", function(event){
    if (event.keyCode == 32){
        document.body.style.cursor = "default";
        state.input.space = false;
    }
})

state.canvas_area.addEventListener("wheel", function(e){
    if (e.deltaY > 0){
        state.main_canvas.zoom("in");
        state.line_canvas.zoom("in");
    } else {
        state.main_canvas.zoom("out")
        state.line_canvas.zoom("out")
    }
    update_mouse_indicator();
    update_canvas_wrapper();
})

state.canvas_wrapper.onmousedown = function(){
    state.active_element = state.canvas_wrapper;
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

state.canvas_area.onmouseover = function(){
    state.mouse_over_canvas_area = true;
};

state.canvas_area.onmouseout = function(){
    state.mouse_over_canvas_area = false;
};