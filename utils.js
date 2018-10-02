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

function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
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
    state.selection_size_element.style.left = event.clientX - state.selection_size_element.clientWidth / 2 + "px";
    state.selection_size_element.style.top = event.clientY + 20 + "px";
    document.getElementById("size-span").innerHTML = "W:" + w + ", H:" + h;
    state.selection_size_element.style.display = "block";
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

function resize_sidebar_window(window_body){
    return function(){
        document.body.style.cursor = "ns-resize";
        window_body.style.height = event.clientY - window_body.getBoundingClientRect().y + "px";
        if(event.clientY - window_body.getBoundingClientRect().y < 0){
            window_body.style.height = 0;
        }
    }
}

function set_active_element(){
    state.active_element = this;
}

function compare_colors(arr1, arr2){
    return arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2] && arr1[3] == arr2[3];
}

function canvas_x(){
    return state.canvas_x;
}

function canvas_y(){
    return state.canvas_y;
}

function canvas_w(){
    return state.doc_w * state.zoom;
}

function canvas_h(){
    return state.doc_h * state.zoom;
}

function calc_pixel_pos(){
    var x = Math.round((event.clientX - 101 - state.canvas_x) / state.zoom - state.brush_size / 2);
    var y = Math.round((event.clientY - 30 - state.canvas_y) / state.zoom - state.brush_size / 2);
    return [x, y];
}

function calc_true_pixel_pos(){
    var x = state.pixel_pos[0] + Math.floor(state.brush_size / 2);
    var y = state.pixel_pos[1] + Math.floor(state.brush_size / 2); 
    return [x, y];
}

function calc_frame_pixel_pos(){
    var x = Math.floor((event.clientX - state.frame_canvas.wrapper.getBoundingClientRect().x) / state.frame_canvas.zoom);
    var y = Math.floor((event.clientY - state.frame_canvas.wrapper.getBoundingClientRect().y) / state.frame_canvas.zoom);
    return [x, y];
}

function tile_x(x){
    return canvas_x() + x * state.tile_w * state.zoom;
}

function tile_y(y){
    return canvas_y() + y * state.tile_h * state.zoom;
}

function update_mouse_indicator(){
    var mouse_indicator_x = state.pixel_pos[0] * state.zoom + canvas_x();
    var mouse_indicator_y = state.pixel_pos[1] * state.zoom + canvas_y();
    var x = Math.max(mouse_indicator_x, canvas_x());
    var y = Math.max(mouse_indicator_y, canvas_y());
    var w = Math.min(mouse_indicator_x + state.brush_size * state.zoom, canvas_x() + canvas_w()) - x;
    var h = Math.min(mouse_indicator_y + state.brush_size * state.zoom, canvas_y() + canvas_h()) - y;

    if(w < 0 || h < 0){
        state.mouse_indicator.style.display = "none";
        return;
    }
    state.mouse_indicator.style.display = "block";

    state.mouse_indicator.style.left = x + "px";
    state.mouse_indicator.style.top = y + "px";
    state.mouse_indicator.style.width = w + "px";
    state.mouse_indicator.style.height = h + "px";
}

function mouse_indicator_from_anim_frame(){
    if(state.frame_pos == null) { return; }
    var mouse_indicator_x = canvas_x() + (state.frame_pos[0] + state.frame_pixel_pos[0] - Math.floor(state.brush_size / 2)) * state.zoom;
    var mouse_indicator_y = canvas_y() + (state.frame_pos[1] + state.frame_pixel_pos[1] - Math.floor(state.brush_size / 2)) * state.zoom;
    var x = Math.max(mouse_indicator_x, canvas_x());
    var y = Math.max(mouse_indicator_y, canvas_y());
    var w = Math.min(mouse_indicator_x + state.brush_size * state.zoom, canvas_x() + canvas_w()) - x;
    var h = Math.min(mouse_indicator_y + state.brush_size * state.zoom, canvas_y() + canvas_h()) - y;
    state.mouse_indicator.style.left = x + "px";
    state.mouse_indicator.style.top = y + "px";
    state.mouse_indicator.style.width = w + "px";
    state.mouse_indicator.style.height = h + "px";
    state.mouse_indicator.style.display = "block";
}

function frame_mouse_indicator_from_anim_frame(){
    if(state.frame_pos == null) { return; }
    state.frame_canvas.mouse_indicator.style.left = (state.pixel_pos[0] - state.frame_pos[0]) * state.frame_canvas.zoom + "px";
    state.frame_canvas.mouse_indicator.style.top = (state.pixel_pos[1] - state.frame_pos[1]) * state.frame_canvas.zoom + "px";
}

function pixel_pos_from_frame(){
    state.pixel_pos[0] = state.frame_pixel_pos[0] + state.frame_pos[0] - Math.floor(state.brush_size / 2);
    state.pixel_pos[1] = state.frame_pixel_pos[1] + state.frame_pos[1] - Math.floor(state.brush_size / 2);
}

function correct_canvas_position(){
    state.pixel_hidden_x = Math.round(-Math.min(state.canvas_x, 0) / state.zoom);
    state.pixel_hidden_y = Math.round(-Math.min(state.canvas_y, 0) / state.zoom);
    if(state.pixel_hidden_x != 0){
        state.canvas_x = -state.pixel_hidden_x * state.zoom;
    }
    if(state.pixel_hidden_y != 0){
        state.canvas_y = -state.pixel_hidden_y * state.zoom;
    }
    state.hidden_x = state.pixel_hidden_x * state.zoom;
    state.hidden_y = state.pixel_hidden_y * state.zoom;

    var x1 = Math.max(canvas_x(), 0);
    var y1 = Math.max(canvas_y(), 0);
    var w = Math.min(canvas_x() + canvas_w(), state.editor.offsetWidth) - x1;
    var h = Math.min(canvas_y() + canvas_h(), state.editor.offsetHeight) - y1;

    state.canvas_handler.draw_canvas.style.left = x1 + "px";
    state.canvas_handler.draw_canvas.style.top = y1 + "px";
    state.canvas_handler.draw_canvas.width = w;
    state.canvas_handler.draw_canvas.height = h;
    state.canvas_handler.draw_ctx.scale(state.zoom, state.zoom);

    state.canvas_handler.render_tile_grid();
    state.canvas_handler.render_draw_canvas();
    state.tile_manager.reposition_indices()
    state.animator.reposition_anim_bounds(state.current_anim);
    state.animator.update_frame_indicator();
    state.selection.update();
}

function download_drawing(name, pixel_scale){
    reset_download_canvas(pixel_scale);

    if(!state.transparency){
        state.download_ctx.fillStyle = "white";
        state.download_ctx.fillRect(0, 0, state.doc_w, state.doc_h);
    }

    for(var i = state.layer_manager.layers.length - 1; i >= 0; i--){
        var layer = state.layer_manager.layers[i];
        state.download_ctx.globalAlpha = layer.opacity;
        state.download_ctx.drawImage(layer.render_canvas, 0, 0);
    }

    download_img(name, state.download_canvas.toDataURL());
}

function download_all_layers(name, pixel_scale){
    reset_download_canvas(pixel_scale);

    state.layer_manager.layers.forEach(layer => {
        state.download_ctx.clearRect(0, 0, state.doc_w, state.doc_h);
        
        if(!state.transparency){
            state.download_ctx.fillStyle = "white";
            state.download_ctx.fillRect(0, 0, state.doc_w, state.doc_h);
        }

        state.download_ctx.globalAlpha = layer.opacity;
        state.download_ctx.drawImage(layer.render_canvas, 0, 0);
        download_img(name, state.download_canvas.toDataURL());
    })
}

function download_current_layer(name, pixel_scale){
    reset_download_canvas(pixel_scale);

    if(!state.transparency){
        state.download_ctx.fillStyle = "white";
        state.download_ctx.fillRect(0, 0, state.doc_w, state.doc_h);
    }

    state.download_ctx.globalAlpha = state.current_layer.opacity;
    state.download_ctx.drawImage(state.current_layer.render_canvas, 0, 0);
    download_img(name, state.download_canvas.toDataURL());
}

function download_img(name, url){
    var link = document.createElement("a");
    link.download = name;
    link.href = url;
    link.click();
}

function reset_download_canvas(pixel_scale){
    state.download_canvas.width = state.doc_w * pixel_scale;
    state.download_canvas.height = state.doc_h * pixel_scale;
    state.download_ctx.mozImageSmoothingEnabled = false;
    state.download_ctx.webkitImageSmoothingEnabled = false;
    state.download_ctx.imageSmoothingEnabled = false;
    state.download_ctx.scale(pixel_scale, pixel_scale);
}
