class Canvas{
    constructor(canvas, w, h){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.preview_canvas = document.getElementById("preview-canvas")
        this.preview_ctx = this.preview_canvas.getContext("2d")
        this.data = []
        this.w = w;
        this.h = h;
        
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70, 90, 128]
        this.current_zoom = 8;
        this.prev_zoom = 8;
        
        this.draw_buffer = []
        this.init_data();

        this.canvas.width = this.w * this.current_zoom;
        this.canvas.height = this.h * this.current_zoom;
        this.canvas.style.width = this.canvas.width;
        this.canvas.style.height = this.canvas.height;
        this.preview_canvas.width = this.canvas.width;
        this.preview_canvas.height = this.canvas.height;
    }

    zoom(direction){
        this.prev_zoom = this.current_zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(this.current_zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.current_zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.current_zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }

        var old_zoom = state.main_canvas.prev_zoom;
        var old_x = state.pixel_pos[0];
        var old_y = state.pixel_pos[1];
        var new_zoom = state.main_canvas.current_zoom;

        var delta_x = old_x * old_zoom - old_x * new_zoom;
        var delta_y = old_y * old_zoom - old_y * new_zoom;

        this.resize(this.w * this.current_zoom, this.h * this.current_zoom);

        drag_element(state.canvas_wrapper, [delta_x, delta_y]);
        
        this.draw_data();
        
        this.resize_preview();
        state.current_selection.move(delta_x, delta_y)
        state.current_selection.resize();
        resize_mouse_indicator();
        resize_canvas_wrapper();
        state.mouse_indicator.style.left = state.pixel_pos[0] * this.current_zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * this.current_zoom + "px";
    }

    init_data(){
        for(var x = 0; x < this.w; x++){
            this.data.push([]);
            for(var y = 0; y < this.h; y++){
                this.data[x].push(new Pixel_Data());
                this.data[x][y].pos = [x, y];
            }
        }
    }

    fill(x, y, new_color, old_color){
        var node = this.data[x][y];
        if(!state.current_selection.contains_pixel_pos(x, y)) { return; }
        if(rgba(node.rgba) == rgba(new_color)){ return; }
        if(rgba(node.rgba) == rgba(old_color)){
            state.history_manager.push_prev_data(node);
            node.rgba = new_color;
            node.color = rgba(new_color);

            if(y < this.h - 1){ this.fill(x, y + 1, new_color, old_color); }
            if(y > 0){ this.fill(x, y - 1, new_color, old_color); }
            if(x < this.w - 1){ this.fill(x + 1, y, new_color, old_color); }
            if(x > 0){ this.fill(x - 1, y, new_color, old_color); }
        }
    }

    draw_data(){
        for(var x = 0; x < this.w; x++){
            for(var y = 0; y < this.h; y++){
                this.draw_pixel(this.data[x][y].color, x * this.current_zoom, Math.round(y * this.current_zoom));
            }
        }
    }

    contains_mouse(){
        var x = state.abs_mouse_pos[0];
        var y = state.abs_mouse_pos[1];
        return (x >= this.canvas.getBoundingClientRect().x &&
                x <= this.canvas.getBoundingClientRect().x + this.canvas.width &&
                y >= this.canvas.getBoundingClientRect().y &&
                y <= this.canvas.getBoundingClientRect().y + this.canvas.height)
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
        if(color == "hsla(0, 100%, 100%, 0)"){
            this.erase_pixel(x / state.main_canvas.current_zoom, y / state.main_canvas.current_zoom);
            return;
        }
        this.ctx.beginPath();
        this.ctx.rect(x, y, this.current_zoom, this.current_zoom);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    erase_pixel(x, y){
        var data = this.data[x][y];
        if (data.color == "hsla(0, 100%, 100%, 0)" || data.color == "hsla(0, 100%, 100%, 1)"){ return; }
        state.history_manager.push_prev_data(data);
        if(state.transparency){
            this.ctx.clearRect(x * this.current_zoom, y * this.current_zoom, this.current_zoom, this.current_zoom);
            data.color = "hsla(0, 100%, 100%, 0)"
            data.rgba = [255, 255, 255, 0];
        } else {
            this.draw_pixel("rgb(255, 255, 255)", x * this.current_zoom, y * this.current_zoom);
            data.color = "hsla(0, 100%, 100%, 1)"
            data.rgba = [255, 255, 255, 1];
        }
        state.history_manager.push_new_data(data);
    }

    line(x0, y0, x1, y1, erase = false){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.ctx.beginPath();
        while(true){
            if(state.current_selection.contains_pixel_pos(x0, y0)){
                if(erase){
                    this.erase_pixel(x0, y0);
                } else {
                    this.draw_pixel(state.color_picker.current_color, x0 * this.current_zoom, y0 * this.current_zoom);
                    var data = this.data[x0][y0]
                    if (data.color != state.color_picker.current_color){
                        state.history_manager.push_prev_data(data);
                        data.color = state.color_picker.current_color;
                        data.rgba = state.color_picker.current_rgba;
                        state.history_manager.push_new_data(data);
                    }
                }
            }
    
            if ((x0==x1) && (y0==y1)) { break; }
    
            var e2 = 2 * err;
            
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

    preview_line(x0, y0, x1, y1){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.preview_ctx.beginPath();
        while(true){
            if(state.current_selection.contains_pixel_pos(x0, y0)){
                this.preview_ctx.rect(x0 * this.current_zoom, y0 * this.current_zoom, this.current_zoom, this.current_zoom);
                this.preview_ctx.fillStyle = state.color_picker.current_color;
                this.preview_ctx.fill();
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

    resize(w, h){
        this.canvas.width = w;
        this.canvas.height = h;
    }

    resize_preview(){
        this.preview_canvas.width = this.canvas.width;
        this.preview_canvas.height = this.canvas.height;
    }

    clear_selection(){
        if (!state.current_selection.exists) { return; }
        var x = state.current_selection.x - state.canvas_wrapper.offsetLeft;
        var y = state.current_selection.y - state.canvas_wrapper.offsetTop;
        this.clear_rect(x, y, state.current_selection.true_w, state.current_selection.true_h);
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clear_preview(){
        this.preview_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clear_rect(x1, y1, w, h){
        this.ctx.clearRect(x1, y1, w, h);
        w /= state.main_canvas.current_zoom;
        h /= state.main_canvas.current_zoom;
        x1 /= state.main_canvas.current_zoom;
        y1 /= state.main_canvas.current_zoom;
        for(var x = x1; x < x1 + w; x++){
            for(var y = y1; y < y1 + h; y++){
                var data = this.data[x][y];
                state.history_manager.push_prev_data(data);
                data.color = "transparent";
                data.rgba = [255, 255, 255 ,0];
                state.history_manager.push_new_data(data);
            }
        }
        state.history_manager.add_history("clear-selection")
    }
}

function Pixel_Data(){
    this.pos = [0, 0]
    this.color = "hsla(0, 100%, 100%, 0)";
    this.rgba = [255, 255, 255, 0];
}