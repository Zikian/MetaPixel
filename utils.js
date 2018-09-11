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
    state.mouse_indicator.style.width = state.zoom * state.brush_size + "px";
    state.mouse_indicator.style.height = state.zoom * state.brush_size + "px";
}

function resize_canvas_wrapper(){
    state.canvas_wrapper.style.width = state.main_canvas.w * state.zoom + "px";
    state.canvas_wrapper.style.height = state.main_canvas.h * state.zoom + "px";
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function canvas_mouse_pos(){
    return [event.clientX - state.canvas_wrapper.getBoundingClientRect().x, event.clientY - state.canvas_wrapper.getBoundingClientRect().y];
}

function true_pixel_pos(){
    x = Math.floor(canvas_mouse_pos()[0] / (state.zoom));
    y = Math.floor(canvas_mouse_pos()[1] / (state.zoom));
    return [x, y];
}

function pixel_pos(){
    var true_pixel = true_pixel_pos();
    x = true_pixel[0] - Math.floor(state.brush_size / 2);
    y = true_pixel[1] - Math.floor(state.brush_size / 2);
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
    state.selection_size_element.style.left = event.clientX - state.selection_size_element.clientWidth / 2 + "px";
    state.selection_size_element.style.top = event.clientY + 20 + "px";
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

function rect_to_square(x1, y1, x2, y2){
    var dx = x2 - x1;   
    var dy = y2 - y1;

    if(dx > 0 && dy > 0){
        return [x1 + dx, y1 + dx];
    } else if (dx > 0 && dy < 0){
        return [x1 + dx, y1 - dx];
    } else if (dx < 0 && dy < 0){
        return [x1 + dx, y1 + dx];
    }
    return [x1 + dx, y1 - dx];
}

function resize_sidebar_window(owner){
    return function(){
        document.body.style.cursor = "ns-resize";
        owner.body.style.height = event.clientY - owner.body.getBoundingClientRect().y + "px";
        if(event.clientY - owner.body.getBoundingClientRect().y < 0){
            owner.body.style.height = 0 + "px";
        }
    }
}

function set_active_element(){
    state.active_element = this;
}

function hide_mouse_indicator(){
    state.mouse_indicator.style.display = "none";
}

function canvas_x(){
    return state.canvas_wrapper.offsetLeft;
}

function canvas_y(){
    return state.canvas_wrapper.offsetTop;
}

function compare_data(arr1, arr2){
    return arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2] && arr1[3] == arr2[3];
}