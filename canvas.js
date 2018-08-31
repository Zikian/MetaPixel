class Canvas{
    constructor(w, h){
        this.draw_preview_canvas = document.getElementById("draw-preview-canvas");
        this.draw_preview_ctx = this.draw_preview_canvas.getContext("2d");
        this.draw_preview_canvas.width = w * state.zoom;
        this.draw_preview_canvas.height = h * state.zoom;

        this.w = w;
        this.h = h;
        
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70]
        
        this.draw_buffer = []

        this.layers = [];
        this.layers.push(new Layer(0, this.w, this.h));
        this.current_layer = this.layers[0]
        this.current_layer.set_active();
    }
    
    add_layer(){
        this.layers.splice(this.current_layer.index, 0, new Layer(this.layers.length, this.w, this.h));
        this.update_layer_indices()
    }

    delete_layer(){
        if (this.layers.length == 1) { return; }
        this.current_layer.delete();
        this.layers.splice(this.current_layer.index, 1);
        this.current_layer = this.layers[0];
        this.current_layer.set_active();
        this.update_layer_indices();
        this.redraw();
        state.preview_canvas.redraw();
    }

    update_layer_indices(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].index = i;
            this.layers[i].reposition();
        }
    }

    change_layer(index){
        this.current_layer.set_inactive();
        this.current_layer = this.layers[index]
        this.current_layer.set_active();
    }

    move_layer(direction){
        if(direction == "up"){
            if(this.current_layer.index >= 1){
                var index = this.current_layer.index;
                this.layers.swapItems(index, index - 1);
                this.update_layer_indices();
            }
        } else {
            if(this.current_layer.index < this.layers.length - 1){
                var index = this.current_layer.index;
                this.layers.swapItems(index, index + 1);
                this.update_layer_indices();
            }
        }
        state.preview_canvas.redraw();
    }

    zoom(direction){
        state.prev_zoom = state.zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(state.zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            state.zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            state.zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }

        var old_zoom = state.prev_zoom;
        var old_x = state.pixel_pos[0];
        var old_y = state.pixel_pos[1];
        var new_zoom = state.zoom;

        var delta_x = old_x * old_zoom - old_x * new_zoom;
        var delta_y = old_y * old_zoom - old_y * new_zoom;

        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].resize();
        }
        this.redraw();

        drag_element(state.canvas_wrapper, [delta_x, delta_y]);
        
        this.draw_preview_canvas.width = this.h * state.zoom;
        this.draw_preview_canvas.height = this.w * state.zoom;
        resize_mouse_indicator();
        resize_canvas_wrapper();
        state.mouse_indicator.style.left = state.pixel_pos[0] * state.zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * state.zoom + "px";

        state.current_selection.move(delta_x, delta_y)
        state.current_selection.resize();
    }

    fill(x, y, new_color, old_color){
        this.current_layer.fill(x, y, new_color, old_color);
    }

    redraw(){
        for(var i = this.layers.length - 1; i >= 0; i--){
            if (this.layers[i].visible){
                this.layers[i].redraw();
            }
        }
    }

    contains_mouse(){
        var x = state.abs_mouse_pos[0];
        var y = state.abs_mouse_pos[1];
        return (x >= state.canvas_wrapper.getBoundingClientRect().x &&
                x <= state.canvas_wrapper.getBoundingClientRect().x + state.canvas_wrapper.clientWidth &&
                y >= state.canvas_wrapper.getBoundingClientRect().y &&
                y <= state.canvas_wrapper.getBoundingClientRect().y + state.canvas_wrapper.clientHeight)
    }

    rectangle(x1, y1, x2, y2){
        this.line(x1, y1, x2, y1);
        this.line(x1, y1, x1, y2);
        this.line(x1, y2, x2, y2);
        this.line(x2, y1, x2, y2);
    }

    preview_rectangle(x1, y1, x2, y2){
        this.preview_line(x1, y1, x2, y1);
        this.preview_line(x1, y1, x1, y2);
        this.preview_line(x1, y2, x2, y2);
        this.preview_line(x2, y1, x2, y2);
    }

    draw_pixel(color, x, y){
        this.current_layer.draw_pixel(color, x, y);
    }

    erase_pixel(x, y){
        this.current_layer.erase_pixel(x, y);
    }

    line(x0, y0, x1, y1, erase = false){
        this.current_layer.line(x0, y0, x1, y1, erase);
    }

    preview_line(x0, y0, x1, y1){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.draw_preview_ctx.beginPath();
        while(true){
            if(state.current_selection.contains_pixel_pos(x0, y0)){
                this.draw_preview_ctx.rect(x0 * state.zoom, y0 * state.zoom, state.zoom, state.zoom);
                this.draw_preview_ctx.fillStyle = state.color_picker.current_color;
                this.draw_preview_ctx.fill();
            }
    
            if ((x0==x1) && (y0==y1)) {
                break;
            }
    
            var e2 = 2*err;
            
            if (e2 >-dy){ 
                err -= dy; 
                x0 += sx;
            }
            
            if (e2 < dx){ 
                err += dx; 
                y0 += sy; 
            }
        }
    }

    clear_selection(){
        if (!state.current_selection.exists) { return; }
        var x = state.current_selection.x - state.canvas_wrapper.offsetLeft;
        var y = state.current_selection.y - state.canvas_wrapper.offsetTop;
        this.clear_rect(x, y, state.current_selection.true_w, state.current_selection.true_h);
        state.preview_canvas.redraw();
    }

    clear(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].clear();
        }
    }

    clear_rect(x1, y1, w, h){
        this.current_layer.clear_rect(x1, y1, w, h);
    }

    clear_preview(){
        this.draw_preview_ctx.clearRect(0, 0, this.w * state.zoom, this.h * state.zoom);
    }

    get_data(x, y){
        return this.current_layer.data[x][y];
    }
}

function Pixel_Data(){
    this.pos = [0, 0]
    this.rgba = [255, 255, 255, 0];
    this.layer = null;
}

class Preview_Canvas{
    constructor(){
        this.canvas = document.getElementById("preview-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = state.main_canvas.w;
        this.canvas.height = state.main_canvas.h;
        
        this.canvas.style.left = (300 - this.canvas.width) / 2 + "px"
        this.canvas.style.top = (170 - this.canvas.height) / 2 + "px"

        this.zoom_stages = this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        this.current_zoom = 1;
        this.zoom_element = document.getElementById("preview-zoom-span");

        document.getElementById("preview-zoom-in").onclick = this.button_zoom(this, "in");
        document.getElementById("preview-zoom-out").onclick = this.button_zoom(this, "out");
    }

    button_zoom(owner, direction){
        return function(){
            if(direction == "in"){
                owner.zoom("in", "button");
            } else {
                owner.zoom("out", "button")
            }
        }
    }

    zoom(direction, origin = null){
        var zoom_stage_index = this.zoom_stages.indexOf(this.current_zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.current_zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.current_zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }   

        this.canvas.width = state.main_canvas.w * this.current_zoom;
        this.canvas.height = state.main_canvas.h * this.current_zoom;

        if(origin == "button"){
            this.canvas.style.left = (300 - this.canvas.width) / 2 + "px";
            this.canvas.style.top = (170 - this.canvas.height) / 2 + "px";
        }

        this.zoom_element.innerHTML = "(" + this.current_zoom + "x)";
        this.redraw();
    }

    redraw(){
        this.clear();
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        for(var i = state.main_canvas.layers.length - 1; i >= 0; i--){
            if (state.main_canvas.layers[i].visible){
                this.ctx.drawImage(state.main_canvas.layers[i].render_canvas, 0, 0, state.main_canvas.w * this.current_zoom, state.main_canvas.h * this.current_zoom);
            }
        }
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
