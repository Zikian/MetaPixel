function setup(){
    state.line_canvas = new Canvas(line_canvas, state.main_canvas.w, state.main_canvas.h)
    update_mouse_indicator();
    update_canvas_wrapper();
    state.canvas_wrapper.style.left = (state.canvas_area.offsetWidth - state.canvas_wrapper.clientWidth)/2 + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.offsetHeight - state.canvas_wrapper.clientHeight)/2 + "px";
    if (!state.transparency){
        state.main_canvas.ctx.beginPath();
        state.main_canvas.ctx.rect(0, 0, state.main_canvas.canvas_width, state.main_canvas.canvas_height);
        state.main_canvas.ctx.fillStyle = "white";
        state.main_canvas.ctx.fill();
    } else {
        state.main_canvas.clear();
    }
    change_tool(state.drawtool);
    state.color_picker.update_color();
}
setup();

function change_tool(tool){
    state.current_tool.style.boxShadow = "none";
    state.current_tool.style.backgroundColor = "transparent";
    state.current_tool = tool;
    tool.style.boxShadow = "0px 0px 0px 3px yellow inset";
    tool.style.backgroundColor = "rgb(66, 66, 66)";
}

function end_line(){
    state.line_canvas.clear();
    state.main_canvas.line(state.mouse_start[0], state.mouse_start[1], state.pixel_pos[0], state.pixel_pos[1]);
}

function end_rectangle(){
    state.line_canvas.clear();
    state.main_canvas.draw_rectangle(state.mouse_start[0], state.mouse_start[1], state.rectangle_end[0], state.rectangle_end[1]);
    state.selection_size_element.style.display = "none";
}

function end_selection(){
    state.selection_size_element.style.display = "none";
}

state.canvas_wrapper.addEventListener("mouseup", function(){
    switch (state.current_tool){
        case state.linetool:
            end_line();
            break;
        case state.rectangletool:
            end_rectangle();
            break;
        case state.selectiontool:
            end_selection();
            break;
    }
});

window.addEventListener('mouseup', function(e) {
    state.main_canvas.draw_buffer = [];

    mouse_up_functions.forEach(function(element){
        element();
    });

    state.active_element = null;
}, false);

window.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    state.mouse_start = state.pixel_pos;

    if(state.active_element == state.canvas_wrapper){
        if(!state.input.shift){
            switch (state.current_tool){
                case state.drawtool:
                    state.main_canvas.draw_pixel(state.color_picker.current_color, state.mouse_indicator.offsetLeft, state.mouse_indicator.offsetTop);
                    state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].color = state.color_picker.current_color;
                    state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].rgba = state.color_picker.current_rgba;
                    break;
                case state.filltool:
                    state.main_canvas.fill(state.pixel_pos[0], state.pixel_pos[1], state.color_picker.current_rgba, state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].rgba);
                    state.main_canvas.draw_data();
                    break;
                case state.eyedroppertool:
                    state.color_picker.update_color("eyedropper");
                    break;
                case state.rectangletool:
                    state.rectangle_end = state.mouse_start;
                    handle_selection_size();
                    break;
                case state.selectiontool:
                    state.line_canvas.clear();
                    state.rectangle_end = state.pixel_pos;
                    state.line_canvas.draw_selection(state.mouse_start[0] * state.main_canvas.current_zoom, 
                                                    state.mouse_start[1] * state.main_canvas.current_zoom, 
                                                    state.rectangle_end[0] * state.main_canvas.current_zoom + state.main_canvas.current_zoom, 
                                                    state.rectangle_end[1] * state.main_canvas.current_zoom + state.main_canvas.current_zoom);
                    handle_selection_size();
                    break;
            }
        }
    }    
}, false);

window.addEventListener("mousemove", function(e){
    pauseEvent(e);

    var prev_abs_mouse_pos = state.abs_mouse_pos.slice();
    state.abs_mouse_pos = [e.pageX, e.pageY];
    var delta_mouse_pos = [state.abs_mouse_pos[0] - prev_abs_mouse_pos[0], state.abs_mouse_pos[1] - prev_abs_mouse_pos[1]]
    
    state.pixel_pos = pixel_pos();

    if(state.main_canvas.contains(state.pixel_pos[0], state.pixel_pos[1])){
        state.mouse_indicator.style.left = state.pixel_pos[0] * state.main_canvas.current_zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * state.main_canvas.current_zoom + "px";
    }

    switch(state.active_element){
        case state.color_picker.header:
            drag_element(state.color_picker.window,  delta_mouse_pos);
            state.color_picker.window.style.top = clamp(state.color_picker.window.offsetTop, state.canvas_area.getBoundingClientRect().y, window.innerHeight) + "px";
            break;
        case state.new_document_panel.header:
            drag_element(state.new_document_panel.panel, delta_mouse_pos);
        case state.canvas_wrapper:
            if (state.input.shift){
                drag_element(state.canvas_wrapper, delta_mouse_pos)
            } else {
                switch(state.current_tool){
                    case state.drawtool:
                        state.main_canvas.draw_buffer.push(state.pixel_pos);
                        if (state.main_canvas.draw_buffer.length == 2){
                            state.main_canvas.line(state.main_canvas.draw_buffer[0][0], state.main_canvas.draw_buffer[0][1], state.main_canvas.draw_buffer[1][0], state.main_canvas.draw_buffer[1][1])
                            state.main_canvas.draw_buffer.shift()
                        }
                        break;
                    case state.erasertool:
                        state.main_canvas.draw_buffer.push(state.pixel_pos);
                        if (state.main_canvas.draw_buffer.length == 2){
                            state.main_canvas.line(state.main_canvas.draw_buffer[0][0], state.main_canvas.draw_buffer[0][1], state.main_canvas.draw_buffer[1][0], state.main_canvas.draw_buffer[1][1], true)
                            state.main_canvas.draw_buffer.shift()
                        }
                        break;
                    case state.linetool:
                        state.line_canvas.clear();
                        state.line_end = state.pixel_pos;
                        state.line_canvas.line(state.mouse_start[0], state.mouse_start[1], state.pixel_pos[0], state.pixel_pos[1])
                        break;
                    case state.rectangletool:
                        state.line_canvas.clear();
                        state.rectangle_end = state.pixel_pos;
                        state.line_canvas.draw_rectangle(state.mouse_start[0], state.mouse_start[1], state.rectangle_end[0], state.rectangle_end[1]);
                        handle_selection_size();
                        break;
                    case state.eyedroppertool:
                        state.color_picker.update_color("eyedropper");
                        break;
                    case state.selectiontool:
                        state.line_canvas.clear();
                        state.rectangle_end = state.pixel_pos;
                        state.line_canvas.draw_selection(state.mouse_start[0] * state.main_canvas.current_zoom, 
                                                         state.mouse_start[1] * state.main_canvas.current_zoom, 
                                                         state.rectangle_end[0] * state.main_canvas.current_zoom + state.main_canvas.current_zoom, 
                                                         state.rectangle_end[1] * state.main_canvas.current_zoom + state.main_canvas.current_zoom);
                        handle_selection_size();
                        break;
                }
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
        case 16: // SHIFT
            state.input.shift = true;
            break;
        case 18: // ALT
            change_tool(state.eyedroppertool);
            break;
        case 67: // C
            state.color_picker.old_color = state.color_picker.current_rgb;
            state.color_picker.old_alpha = state.color_picker.current_alpha;
            state.color_picker.toggle_display();
            state.color_picker.old_color_rect.style.backgroundColor = state.color_picker.current_color;
            break;
        case 68: // D
            change_tool(state.drawtool);
            break;
        case 69: // E
            change_tool(state.erasertool);
            break;
        case 70: // F
            change_tool(state.filltool);
            break;
        case 71: // G
            change_tool(state.linetool);
            break;
        case 83: // S
            change_tool(state.selectiontool);
            break;
        case 88: // X
            state.color_picker.update_color("switch-selected-color");
            break;
        case 187:
            state.main_canvas.zoom("in");
            state.line_canvas.zoom("in");
            update_mouse_indicator();
            update_canvas_wrapper();
            break;
        case 189:
            state.main_canvas.zoom("out");
            state.line_canvas.zoom("out");
            update_mouse_indicator();
            update_canvas_wrapper();
            break;
    }
})

document.addEventListener("keyup", function(event){
    if (event.keyCode == 16){
        state.input.shift = false;
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
    state.color_picker.update_color("switch-selected-color");
}

state.reset_colors_button.onclick = function(){
    state.color_picker.update_color("reset-colors");
}