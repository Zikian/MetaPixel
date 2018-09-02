Array.prototype.swapItems = function(a, b){
    this[a] = this.splice(b, 1, this[a])[0];
    return this;
}

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}

function resize_mouse_indicator(){
    state.mouse_indicator.style.width = state.zoom + "px";
    state.mouse_indicator.style.height = state.zoom + "px";
}

function resize_canvas_wrapper(){
    state.canvas_wrapper.style.width = state.main_canvas.w * state.zoom + "px";
    state.canvas_wrapper.style.height = state.main_canvas.h * state.zoom + "px";
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function canvas_mouse_pos(){
    return [state.abs_mouse_pos[0] - state.canvas_wrapper.getBoundingClientRect().x, state.abs_mouse_pos[1] - state.canvas_wrapper.getBoundingClientRect().y];
}

function pixel_pos(){
    x = Math.floor(canvas_mouse_pos()[0] / (state.zoom));
    y = Math.floor(canvas_mouse_pos()[1] / (state.zoom));
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

function update_rect_size_preview(w, h){
    state.selection_size_element.style.display = "block";
    state.selection_size_element.style.left = state.abs_mouse_pos[0] - state.selection_size_element.clientWidth / 2 + "px";
    state.selection_size_element.style.top = state.abs_mouse_pos[1] + 20 + "px";
    document.getElementById("size-span").innerHTML = "W:" + w + ", H:" + h;
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



function calc_distance(x1, x2){
    if(x1 < x2){
        return x2 - x1 + 1
    } else if (x2 < x1){
        return x1 - x2 + 1
    } else {
        return 1
    }
}