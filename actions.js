function setup(){
    state.mouse_indicator.style.height = Math.ceil(state.main_canvas.draw_size) + "px";
    state.mouse_indicator.style.width = Math.ceil(state.main_canvas.draw_size) + "px";
    state.canvas_wrapper.style.left = (state.canvas_area.offsetWidth - state.canvas_wrapper.clientWidth)/2 + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.offsetHeight - state.canvas_wrapper.clientHeight)/2 + "px";
    state.main_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);
    state.line_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);
    change_tool(state.drawtool);
}
setup();

function zoom(e){
    let prev_zoom = state.main_canvas.zoom;
    if (e.deltaY < 0) {
        if (state.main_canvas.zoom > 50){
            state.main_canvas.zoom -= 10;
        }
    }
    if (e.deltaY > 0) {
        if (state.main_canvas.zoom < 10000){
            state.main_canvas.zoom += 10;
        }
    }

    state.main_canvas.draw_size = state.main_canvas.zoom / state.main_canvas.w;

    state.canvas_wrapper.style.width = state.main_canvas.zoom + "px";
    state.canvas_wrapper.style.height = state.main_canvas.zoom + "px";

    state.mouse_indicator.style.height = state.main_canvas.draw_size + "px";
    state.mouse_indicator.style.width = state.main_canvas.draw_size + "px";

    state.mouse_indicator.style.left = state.pixel_pos[0] * state.main_canvas.draw_size + "px";
    state.mouse_indicator.style.top = state.pixel_pos[1] * state.main_canvas.draw_size + "px";

    let factor = prev_zoom/state.main_canvas.zoom;
    let delta_pos = [canvas_mouse_pos()[0] * (factor - 1), canvas_mouse_pos()[1] * (factor - 1)];
    drag_element(state.canvas_wrapper, delta_pos)

    state.main_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);
    state.line_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);

    state.main_canvas.draw_data();
}

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

//USER ACTIONS

state.file.onclick = function(){
    state.file_dropdown.style.display = "block";
    state.file.style.backgroundColor = "gray";
};

state.file.onmouseout = function () {
    state.file_dropdown.style.display = "none";
}

state.file_dropdown.onmouseover = function () {
    state.file_dropdown.style.display = "block";
    state.file.style.backgroundColor = "gray";
}

state.file_dropdown.onmouseout = function () {
    state.file_dropdown.style.display = "none";
    state.file.style.backgroundColor = "transparent";
}

state.canvas_area.addEventListener('wheel', function(e) {
    zoom(e);
});

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
                    state.line_canvas.draw_selection(Math.round(state.mouse_start[0] * state.main_canvas.draw_size), 
                                                    Math.round(state.mouse_start[1] * state.main_canvas.draw_size), 
                                                    Math.round(state.rectangle_end[0] * state.main_canvas.draw_size + state.main_canvas.draw_size), 
                                                    Math.round(state.rectangle_end[1] * state.main_canvas.draw_size + state.main_canvas.draw_size));
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

    state.mouse_indicator.style.left = state.pixel_pos[0] * state.main_canvas.draw_size + "px";
    state.mouse_indicator.style.top = state.pixel_pos[1] * state.main_canvas.draw_size + "px";

    switch(state.active_element){
        case state.color_picker.header:
            drag_element(state.color_picker.window,  delta_mouse_pos);
            state.color_picker.window.style.top = clamp(state.color_picker.window.offsetTop, state.canvas_area.getBoundingClientRect().y, window.innerHeight) + "px";
            break;
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
                        state.line_canvas.line(state.mouse_start[0], state.mouse_start[1], state.line_end[0], state.line_end[1])
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
                        state.line_canvas.draw_selection(Math.round(state.mouse_start[0] * state.main_canvas.draw_size), 
                                                         Math.round(state.mouse_start[1] * state.main_canvas.draw_size), 
                                                         Math.round(state.rectangle_end[0] * state.main_canvas.draw_size + state.main_canvas.draw_size), 
                                                         Math.round(state.rectangle_end[1] * state.main_canvas.draw_size + state.main_canvas.draw_size));
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
    }   
})

document.addEventListener("keyup", function(event){
    if (event.keyCode == 16){
        state.input.shift = false;
    }
})

state.clear.addEventListener("mousedown", function(){
    let clear = confirm("Are you sure?")
    if(clear){
        state.main_canvas;
    }
});

state.save_as.onclick = function(){
    state.saved_img = state.main_canvas.toDataURL();
    download_img(state.saved_img);
}

state.canvas_wrapper.onmousedown = function(){
    state.active_element = state.canvas_wrapper;
}

state.switch_colors_button.onclick = function(){
    state.color_picker.update_color("switch-selected-color");
}

state.reset_colors_button.onclick = function(){
    state.color_picker.update_color("reset-colors");
}