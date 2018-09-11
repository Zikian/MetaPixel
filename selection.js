class Selection{
    constructor(){
        this.x = canvas_x();
        this.y = canvas_y();
        this.w = state.main_canvas.w;
        this.h = state.main_canvas.h;

        // Check if selection exists
        this.exists = false;

        // Check if selection is being made
        this.forming = false;

        // Checl if the user is dragging a selection
        this.being_dragged = false;

        this.selection_rect = document.getElementById("selection-rect");
    }

    width(){ return this.w * state.zoom; }

    height(){ return this.h * state.zoom; }

    get_selection_info(){
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            width: this.width(),
            height: this.height(),
            exists: this.exists
        }
    }

    draw(){
        this.selection_rect.style.display = "block";
        
        if(state.input.shift){
            state.seleciton_end = rect_to_square(...state.selection_start, ...state.seleciton_end);
        }

        var x1 = state.selection_start[0];
        var y1 = state.selection_start[1];
        var x2 = state.selection_end[0];
        var y2 = state.selection_end[1];

        if (x1 == x2 && y1 == y2){ 
            this.draw_selection(x1, y1, x1 + 1, y1 + 1); 
        }
        else if (x1 < x2 && y1 == y2){
            this.draw_selection(x1, y1, x2 + 1, y1 + 1);
        }
        else if (x1 <= x2 && y1 < y2){
            this.draw_selection(x1, y1, x2 + 1, y2 + 1);
        }
        else if (x2 < x1 && y2 > y1){
            this.draw_selection(x2, y1, x1 + 1, y2 + 1);
        }
        else if (x2 < x1 && y2 == y1){
            this.draw_selection(x2, y2, x1 + 1, y2 + 1);
        }
        else if (x2 <= x1 && y2 < y1){
            this.draw_selection(x2, y2, x1 + 1, y1 + 1);
        }
        else if (y2 < y1 && x1 < x2){
            this.draw_selection(x1, y2, x2 + 1, y1 + 1);
        }
    }

    draw_selection(x1, y1, x2, y2){
        var w = x2 - x1;
        var h = y2 - y1;

        this.x = x1 * state.zoom + canvas_x();
        this.y = y1 * state.zoom + canvas_y();
        this.w = w;
        this.h = h;
        this.exists = true;

        this.selection_rect.style.left = this.x + "px";
        this.selection_rect.style.top = this.y + "px"
        this.selection_rect.style.width = w * state.zoom - 1 + "px";
        this.selection_rect.style.height = h * state.zoom - 1 + "px";
    }

    get_intersection(){
        if(!this.exists) { this.clear(); return; }

        var canvas_w = state.canvas_wrapper.clientWidth;
        var canvas_h = state.canvas_wrapper.clientHeight;

        if(this.y + this.height() <= canvas_y() || 
           this.y >= canvas_y() + canvas_w ||
          this.x + this.width() <= canvas_x() || 
          this.x >= canvas_x() + canvas_w) {
              this.clear();
              return;
        }
        var x1 = (Math.max(this.x,  canvas_x()) - canvas_x()) / state.zoom;
        var y1 = (Math.max(this.y, canvas_y()) - canvas_y()) / state.zoom;
        var x2 = (Math.min(this.x + this.width(),  canvas_x() + canvas_w) - canvas_x()) / state.zoom;
        var y2 = (Math.min(this.y + this.height(),  canvas_y() + canvas_h) - canvas_y()) / state.zoom;

        this.draw_selection(x1, y1, Math.round(x2), Math.round(y2));
        state.layer_manager.clip_current();
    }

    clear(){
        this.selection_rect.style.display = "none";
        this.exists = false;
        this.wrap_around_canvas();
        state.layer_manager.clip_current();
    }

    wrap_around_canvas(){
        this.x = canvas_x();
        this.y = canvas_y();
        this.w = state.main_canvas.w
        this.h = state.main_canvas.h
    }

    contains_pixel(x, y){
        var pos_x = (this.x - canvas_x())/state.zoom;
        var pos_y = (this.y - canvas_y())/state.zoom;
        return (x >= pos_x && 
                y >= pos_y && 
                x < pos_x + this.w && 
                y < pos_y + this.h)
    }

    move(x, y){
        this.x += x
        this.y += y
    }

    drag(){
        this.x += state.delta_pixel_pos[0] * state.zoom;
        this.y += state.delta_pixel_pos[1] * state.zoom;
        this.selection_rect.style.left = this.x + "px";
        this.selection_rect.style.top = this.y + "px";
    }

    resize(){
        if(!this.exists) { 
            this.wrap_around_canvas();
            return;
        }
        
        var old_pixel_x = (this.x - canvas_x()) / state.prev_zoom;
        var old_pixel_y = (this.y - canvas_y()) / state.prev_zoom;
        
        var delta_x = old_pixel_x * state.zoom - old_pixel_x * state.prev_zoom;
        var delta_y = old_pixel_y * state.zoom - old_pixel_y * state.prev_zoom;  

        var new_x = (this.x + delta_x - canvas_x()) / state.zoom;
        var new_y = (this.y + delta_y - canvas_y()) / state.zoom;

        this.draw_selection(new_x, new_y, new_x + this.w, new_y + this.h);
        state.layer_manager.clip_current();
    }
}