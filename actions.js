function setup(){
    state.mouse_indicator.style.height = Math.ceil(state.main_canvas.draw_size) + "px";
    state.mouse_indicator.style.width = Math.ceil(state.main_canvas.draw_size) + "px";
    state.canvas_wrapper.style.left = (state.canvas_area.offsetWidth - state.canvas_wrapper.clientWidth)/2 + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.offsetHeight - state.canvas_wrapper.clientHeight)/2 + "px";
    state.main_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);
    state.line_canvas.resize(state.canvas_wrapper.clientWidth, state.canvas_wrapper.clientHeight);
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

    state.mouse_indicator.style.left = state.mouse_pos[0] * state.main_canvas.draw_size + "px";
    state.mouse_indicator.style.top = state.mouse_pos[1] * state.main_canvas.draw_size + "px";

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
    state.main_canvas.draw_buffer = [];
    state.line_canvas.clear();
    state.main_canvas.line(state.mouse_start[0], state.mouse_start[1], state.mouse_pos[0], state.mouse_pos[1]);
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
    if (state.current_tool == state.linetool){
        end_line();
    }
});

window.addEventListener('mouseup', function(e) {
    state.input.mousedown = false;
    state.main_canvas.draw_buffer = [];

    for(var i = 0; i < mouse_up_functions.length; i++){
        mouse_up_functions[i]();
    }

    state.active_element = null;
}, false);

window.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    state.mouse_start = state.mouse_pos;
    state.input.mousedown = true;

    if(state.active_element == state.color_picker.color_slider.selector){
        state.color_picker.color_slider.move_slider();
        state.color_picker.update_color(state.color_picker.color_slider.name);
    } else if(state.active_element == state.canvas_wrapper){
        if(!state.input.shift){
            if (state.current_tool == state.drawtool){
                state.main_canvas.draw_pixel(state.color_picker.current_color, state.mouse_indicator.offsetLeft, state.mouse_indicator.offsetTop);
            }
        }
    }
}, false);

window.addEventListener("mousemove", function(e){
    e.stopPropagation();

    let prev_abs_mouse_pos = state.abs_mouse_pos.slice();
    let x = e.pageX;
    let y = e.pageY;
    state.abs_mouse_pos = [x, y];
    state.delta_mouse_pos = [state.abs_mouse_pos[0] - prev_abs_mouse_pos[0], state.abs_mouse_pos[1] - prev_abs_mouse_pos[1]]
    
    x = Math.floor(canvas_mouse_pos()[0] / (state.main_canvas.draw_size));
    y = Math.floor(canvas_mouse_pos()[1] / (state.main_canvas.draw_size));
    state.mouse_pos = [x, y];

    state.mouse_indicator.style.left = x * state.main_canvas.draw_size + "px";
    state.mouse_indicator.style.top = y * state.main_canvas.draw_size + "px";

    if(state.active_element == state.color_picker.header){
        drag_element(state.color_picker.window, state.delta_mouse_pos);
    } else if(state.active_element == state.canvas_wrapper){
        if (state.input.shift){
            drag_element(state.canvas_wrapper, state.delta_mouse_pos)
        } else {
            if (state.current_tool == state.drawtool){
                state.main_canvas.draw_buffer.push(state.mouse_pos);
                if (state.main_canvas.draw_buffer.length == 2){
                    state.main_canvas.line(state.main_canvas.draw_buffer[0][0], state.main_canvas.draw_buffer[0][1], state.main_canvas.draw_buffer[1][0], state.main_canvas.draw_buffer[1][1])
                    state.main_canvas.draw_buffer.shift()
                }
            } else if(state.current_tool == state.erasertool){
                state.main_canvas.draw_buffer.push(state.mouse_pos);
                if (state.main_canvas.draw_buffer.length == 2){
                    state.main_canvas.line(state.main_canvas.draw_buffer[0][0], state.main_canvas.draw_buffer[0][1], state.main_canvas.draw_buffer[1][0], state.main_canvas.draw_buffer[1][1], true)
                    state.main_canvas.draw_buffer.shift()
                }
            } else if(state.current_tool == state.linetool){
                state.line_canvas.clear();
                state.line_end = state.mouse_pos;
                state.line_canvas.line(state.mouse_start[0], state.mouse_start[1], state.line_end[0], state.line_end[1])
            }
        }
    } 

    for(var i = 0; i < mouse_move_functions.length; i++){
        mouse_move_functions[i]();
    }
});

document.addEventListener("keydown", function(event){
    if (event.keyCode == 16){
        state.input.shift = true;
    }
    if (event.keyCode == 67){
        state.color_picker.old_color = state.color_picker.current_rgb;
        state.color_picker.old_alpha = state.color_picker.current_alpha;
        state.color_picker.toggle_display();
        state.color_picker.old_color_rect.style.backgroundColor = state.color_picker.current_color;
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
    state.saved_img = state.main_canvas.toDataURL("test/png");
    download_img(state.saved_img);
}