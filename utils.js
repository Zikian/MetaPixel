function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

function update_mouse_indicator(){
    state.mouse_indicator.style.width = state.main_canvas.current_zoom + "px";
    state.mouse_indicator.style.height = state.main_canvas.current_zoom + "px";
}

function update_canvas_wrapper(){
    state.canvas_wrapper.style.width = state.main_canvas.canvas.width + "px";
    state.canvas_wrapper.style.height = state.main_canvas.canvas.height + "px";
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function canvas_mouse_pos(){
    return [state.abs_mouse_pos[0] - state.canvas_wrapper.getBoundingClientRect().x, state.abs_mouse_pos[1] - state.canvas_wrapper.getBoundingClientRect().y];
}

function pixel_pos(){
    x = Math.floor(canvas_mouse_pos()[0] / (state.main_canvas.current_zoom));
    y = Math.floor(canvas_mouse_pos()[1] / (state.main_canvas.current_zoom));
    return [x, y];
}

function download_img(img){
    let link = document.createElement("a");
    let name = get_file_name();
    if(name == null){
        return
    } else {
        link.download = get_file_name();
        link.href = img;
        link.click();
    }
}

function handle_selection_size(){
    state.selection_size_element.style.display = "block";
    state.selection_size_element.style.left = state.abs_mouse_pos[0] - state.selection_size_element.clientWidth / 2 + "px";
    state.selection_size_element.style.top = state.abs_mouse_pos[1] + 20 + "px";
    document.getElementById("size-span").innerHTML = "W:" + state.current_selection.w + ", H:" + state.current_selection.h;
}

function get_file_name(){
    let name = prompt("Enter Filename");
    if (name == null){
        return null;
    }
    else {
        return name;
    }
}

function drag_element(elem, delta_pos){
    elem.style.left = elem.offsetLeft + delta_pos[0] + "px";
    elem.style.top = elem.offsetTop + delta_pos[1] + "px";
}

function is_number(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

function is_hex(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode
    if(charCode >= 97 && charCode <= 102){
        return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

function selection_from_rectangle(x1, y1, x2, y2){
    var pixel_size = state.main_canvas.current_zoom;
    x1 *= pixel_size;
    y1 *= pixel_size;
    x2 *= pixel_size;
    y2 *= pixel_size;


    if (x1 == x2 && y1 == y2){ 
        calculate_size(x1, y1, x1 + pixel_size, y1 + pixel_size); 
    }
    else if (x1 < x2 && y1 == y2){
        calculate_size(x1, y1, x2 + pixel_size, y1 + pixel_size);
    }
    else if (x1 <= x2 && y1 < y2){
        calculate_size(x1, y1, x2 + pixel_size, y2 + pixel_size);
    }
    else if (x2 < x1 && y2 > y1){
        calculate_size(x2, y1, x1 + pixel_size, y2 + pixel_size);
    }
    else if (x2 < x1 && y2 == y1){
        calculate_size(x2, y2, x1 + pixel_size, y2 + pixel_size);
    }
    else if (x2 <= x1 && y2 < y1){
        calculate_size(x2, y2, x1 + pixel_size, y1 + pixel_size);
    }
    else if (y2 < y1 && x1 < x2){
        calculate_size(x1, y2, x2 + pixel_size, y1 + pixel_size);
    }
}

function calculate_size(x1, y1, x2, y2){
    var w = Math.abs(x2 - x1)/state.main_canvas.current_zoom;
    var h = Math.abs(y2 - y1)/state.main_canvas.current_zoom;
}