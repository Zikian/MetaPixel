class Main_Canvas{
    constructor(w, h){
        this.draw_preview_canvas = document.getElementById("draw-preview-canvas");
        this.draw_preview_ctx = this.draw_preview_canvas.getContext("2d");
        this.draw_preview_canvas.width = w * state.zoom;
        this.draw_preview_canvas.height = h * state.zoom;

        this.background_canvas = document.getElementById("background-canvas");
        this.background_ctx = this.background_canvas.getContext("2d");
        this.background_canvas.width = w * state.zoom;
        this.background_canvas.height = h * state.zoom;

        this.draw_canvas = document.getElementById("draw-canvas");
        this.draw_ctx = this.draw_canvas.getContext("2d");
        this.draw_canvas.width = w * state.zoom;
        this.draw_canvas.height = h * state.zoom;

        this.foreground_canvas = document.getElementById("foreground-canvas")
        this.foreground_ctx = this.foreground_canvas.getContext("2d")
        this.foreground_canvas.width = w * state.zoom;
        this.foreground_canvas.height = h * state.zoom;

        this.w = w;
        this.h = h;
        
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70]
        
        this.draw_buffer = []
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

        state.layer_manager.resize_layers();
        state.layer_manager.redraw_layers();

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
        state.layer_manager.current_layer.fill(x, y, new_color, old_color);
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
        state.layer_manager.current_layer.draw_pixel(color, x, y);
    }

    erase_pixel(x, y){
        state.layer_manager.current_layer.erase_pixel(x, y);
    }

    line(x0, y0, x1, y1, erase = false){
        state.layer_manager.current_layer.line(x0, y0, x1, y1, erase);
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
                this.draw_preview_ctx.fillStyle = state.color_picker.color;
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

    clear_rect(x1, y1, w, h){
        state.layer_manager.current_layer.clear_rect(x1, y1, w, h);
    }

    clear_preview(){
        this.draw_preview_ctx.clearRect(0, 0, this.w * state.zoom, this.h * state.zoom);
    }

    get_data(x, y){
        return state.layer_manager.current_layer.data[x][y];
    }
}

function Pixel_Data(){
    this.rgba = [255, 255, 255, 0];
    this.pos = null;
}

