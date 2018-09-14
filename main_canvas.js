class Main_Canvas{
    constructor(w, h){
        this.draw_preview_canvas = document.getElementById("draw-preview-canvas");
        this.draw_preview_ctx = this.draw_preview_canvas.getContext("2d");
        this.draw_preview_canvas.width = w * state.zoom;
        this.draw_preview_canvas.height = h * state.zoom;

        this.w = w;
        this.h = h;
        
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70]
        
        this.draw_buffer = []
    }

    zoom(direction){
        var start = performance.now();
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
        // state.layer_manager.redraw_layers();
        
        drag_element(state.canvas_wrapper, [delta_x, delta_y]);
        
        this.draw_preview_canvas.width = this.h * state.zoom;
        this.draw_preview_canvas.height = this.w * state.zoom;
        resize_mouse_indicator();
        resize_canvas_wrapper();
        state.mouse_indicator.style.left = state.pixel_pos[0] * state.zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * state.zoom + "px";
        
        state.selection.move(delta_x, delta_y)
        state.selection.resize();

        state.tile_manager.resize_grid();
        state.tile_manager.reposition_indices();
        var end = performance.now();
        console.log("call took:" + (end - start) + "milliseconds")
    }
    
    fill(x, y, new_color, old_color){
        state.layer_manager.current_layer.fill(x, y, new_color, old_color);
    }

    contains_mouse(){
        var x = event.clientX;
        var y = event.clientY;
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

    preview_ellipse(x0, y0, x1, y1){
        var a = Math.abs(x1-x0), b = Math.abs(y1-y0), b1 = b&1;        /* diameter */
        var dx = 4*(1.0-a)*b*b, dy = 4*(b1+1)*a*a;              /* error increment */
        var err = dx+dy+b1*a*a, e2;                             /* error of 1.step */

        if (x0 > x1) { x0 = x1; x1 += a; }        /* if called with swapped points */
        if (y0 > y1) y0 = y1;                                  /* .. exchange them */
        y0 += (b+1)>>1; y1 = y0-b1;                              /* starting pixel */
        a = 8*a*a; b1 = 8*b*b;                               
                                                                
        do {                                                 
            this.preview_pixel(x1, y0);                                      /*   I. Quadrant */
            this.preview_pixel(x0, y0);                                      /*  II. Quadrant */
            this.preview_pixel(x0, y1);                                      /* III. Quadrant */
            this.preview_pixel(x1, y1);                                      /*  IV. Quadrant */
            e2 = 2*err;
            if (e2 <= dy) { y0++; y1--; err += dy += a; }                 /* y step */
            if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; }       /* x */
        } while (x0 <= x1);

        while (y0-y1 <= b) {                /* too early stop of flat ellipses a=1 */
            this.preview_pixel(x0-1, y0);                         /* -> finish tip of ellipse */
            this.preview_pixel(x1+1, y0++);
            this.preview_pixel(x0-1, y1);
            this.preview_pixel(x1+1, y1--);
        }
    }

    preview_pixel(x, y){
        this.draw_preview_ctx.rect(x * state.zoom, y * state.zoom, state.zoom * state.brush_size, state.zoom * state.brush_size);
        this.draw_preview_ctx.fillStyle = state.color_picker.color;
        this.draw_preview_ctx.fill();
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

    ellipse(x1, y1, x2, y2){
        state.layer_manager.current_layer.ellipse(x1, y1, x2, y2);
    }

    preview_line(x0, y0, x1, y1){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.draw_preview_ctx.beginPath();
        while(true){
            this.preview_pixel(x0, y0)
    
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
        if (!state.selection.exists) { return; }
        var x = state.selection.x - canvas_x();
        var y = state.selection.y - canvas_y();
        this.clear_rect(x, y, state.selection.width(), state.selection.height());
        state.preview_canvas.redraw();
    }

    clear_rect(x1, y1, w, h){
        state.layer_manager.current_layer.clear_rect(x1, y1, w, h);
    }

    clear_preview(){
        this.draw_preview_canvas.width = this.draw_preview_canvas.width;
    }
}
