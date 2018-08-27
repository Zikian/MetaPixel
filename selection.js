class Selection{
    constructor(){
        this.x = state.canvas_wrapper.offsetLeft;
        this.y = state.canvas_wrapper.offsetTop;
        this.w = state.main_canvas.w;
        this.h = state.main_canvas.h;
        this.true_w = state.main_canvas.canvas.width;
        this.true_h = state.main_canvas.canvas.height;

        // If a selection exists, this is true
        this.exists = false;

        // If the user is making a selection, this is true
        this.forming = false;

        // If the user is dragging a selection, this is true
        this.being_dragged = false;

        // Separate canvases to draw the selection, so that a massive canvas isn't needed
        this.top_border = document.getElementById("selection-top");
        this.left_border = document.getElementById("selection-left");
        this.bottom_border = document.getElementById("selection-bottom");
        this.right_border = document.getElementById("selection-right");

        this.top_ctx = this.top_border.getContext("2d")
        this.left_ctx = this.left_border.getContext("2d")
        this.bottom_ctx = this.bottom_border.getContext("2d")
        this.right_ctx = this.right_border.getContext("2d")
    }

    draw(){
        var pixel_size = state.main_canvas.current_zoom;

        var x1 = state.mouse_start[0] * pixel_size;
        var y1 = state.mouse_start[1] * pixel_size;
        var x2 = state.selection_end[0] * pixel_size;
        var y2 = state.selection_end[1] * pixel_size;

        if (x1 == x2 && y1 == y2){ 
            this.draw_selection(x1, y1, x1 + pixel_size, y1 + pixel_size); 
        }
        else if (x1 < x2 && y1 == y2){
            this.draw_selection(x1, y1, x2 + pixel_size, y1 + pixel_size);
        }
        else if (x1 <= x2 && y1 < y2){
            this.draw_selection(x1, y1, x2 + pixel_size, y2 + pixel_size);
        }
        else if (x2 < x1 && y2 > y1){
            this.draw_selection(x2, y1, x1 + pixel_size, y2 + pixel_size);
        }
        else if (x2 < x1 && y2 == y1){
            this.draw_selection(x2, y2, x1 + pixel_size, y2 + pixel_size);
        }
        else if (x2 <= x1 && y2 < y1){
            this.draw_selection(x2, y2, x1 + pixel_size, y1 + pixel_size);
        }
        else if (y2 < y1 && x1 < x2){
            this.draw_selection(x1, y2, x2 + pixel_size, y1 + pixel_size);
        }
    }

    draw_selection(x1, y1, x2, y2){
        x1 += state.canvas_wrapper.offsetLeft;
        x2 += state.canvas_wrapper.offsetLeft;
        y1 += state.canvas_wrapper.offsetTop;
        y2 += state.canvas_wrapper.offsetTop;
        var w = x2 - x1;
        var h = y2 - y1;

        this.top_border.width = w;
        this.left_border.height = h;
        this.bottom_border.width = w;
        this.right_border.height = h;

        this.top_border.style.left = x1 + "px";
        this.top_border.style.top = y1 + "px";
        this.left_border.style.left = x1 + "px";
        this.left_border.style.top = y1 + "px";
        this.bottom_border.style.left = x1 + "px";
        this.bottom_border.style.top = y2 - 1 + "px";
        this.right_border.style.left = x2 - 1 + "px";
        this.right_border.style.top = y1 + "px";

        this.top_ctx.fillStyle = "red";
        this.left_ctx.fillStyle = "red";
        this.bottom_ctx.fillStyle = "red";
        this.right_ctx.fillStyle = "red";

        this.top_ctx.fillRect(0, 0, w, 1);
        this.left_ctx.fillRect(0, 0, 1, h);
        this.bottom_ctx.fillRect(0, 0, w, 1);
        this.right_ctx.fillRect(0, 0, 1, h);

        this.x = x1;
        this.y = y1;
        this.w = w/state.main_canvas.prev_zoom;
        this.h = h/state.main_canvas.prev_zoom;
        this.true_w = w;
        this.true_h = h;
        this.exists = true;
    }

    get_intersection(){
        if(this.y + this.true_h <= state.canvas_wrapper.offsetTop || this.y >= state.canvas_wrapper.offsetTop + state.canvas_wrapper.clientHeight ||
          this.x + this.true_w <= state.canvas_wrapper.offsetLeft || this.x >= state.canvas_wrapper.offsetLeft + state.canvas_wrapper.clientWidth ||
          !this.exists) {
              this.clear();
              return;
        }
        var x1 = Math.max(this.x,  state.canvas_wrapper.offsetLeft) - state.canvas_wrapper.offsetLeft;
        var y1 = Math.max(this.y, state.canvas_wrapper.offsetTop) - state.canvas_wrapper.offsetTop;
        var x2 = Math.min(this.x + this.true_w,  state.canvas_wrapper.offsetLeft + state.canvas_wrapper.clientWidth) - state.canvas_wrapper.offsetLeft;
        var y2 = Math.min(this.y + this.true_h,  state.canvas_wrapper.offsetTop + state.canvas_wrapper.clientHeight) - state.canvas_wrapper.offsetTop;
        this.draw_selection(x1, y1, x2, y2);
    }

    clear(){
        this.top_ctx.clearRect(0, 0, this.w * state.main_canvas.current_zoom, 1);
        this.left_ctx.clearRect(0, 0, 1, this.h * state.main_canvas.current_zoom);
        this.bottom_ctx.clearRect(0, 0, this.w * state.main_canvas.current_zoom, 1);
        this.right_ctx.clearRect(0, 0, 1, this.h * state.main_canvas.current_zoom);
        this.exists = false;
        this.wrap_around_canvas();
    }

    wrap_around_canvas(){
        this.x = state.canvas_wrapper.offsetLeft;
        this.y = state.canvas_wrapper.offsetTop;
        this.w = state.main_canvas.w
        this.h = state.main_canvas.h
        this.true_w = state.main_canvas.canvas.width;
        this.true_h = state.main_canvas.canvas.height;
    }

    contains_mouse(){
        var x = state.abs_mouse_pos[0];
        var y = state.abs_mouse_pos[1];
        return (x >= this.x + state.canvas_area.offsetLeft &&
                x <= this.x + state.canvas_area.offsetLeft + this.true_w &&
                y >= this.y + state.canvas_area.offsetTop &&
                y <= this.y + state.canvas_area.offsetTop + this.true_h)
    }

    contains_pixel_pos(x, y){
        x *= state.main_canvas.current_zoom;
        y *= state.main_canvas.current_zoom;
        var pos_x = this.x - state.canvas_wrapper.offsetLeft;
        var pos_y = this.y - state.canvas_wrapper.offsetTop;
        return (x >= pos_x && y >= pos_y && x < pos_x + this.true_w && y < pos_y + this.true_h)
    }

    move(x, y){
        this.x += x
        this.y += y
        if(this.exists){
            this.draw_selection(this.x - state.canvas_wrapper.offsetLeft, this.y - state.canvas_wrapper.offsetTop, this.x + this.true_w - state.canvas_wrapper.offsetLeft, this.y + this.true_h - state.canvas_wrapper.offsetTop);
        }
    }

    drag(){
        if (!this.exists) { return; }
        this.x += state.delta_pixel_pos[0] * state.main_canvas.current_zoom;
        this.y += state.delta_pixel_pos[1] * state.main_canvas.current_zoom;
        this.draw_selection(this.x - state.canvas_wrapper.offsetLeft, this.y - state.canvas_wrapper.offsetTop, this.x + this.true_w - state.canvas_wrapper.offsetLeft, this.y + this.true_h - state.canvas_wrapper.offsetTop);
    }

    resize(){
        if(!this.exists) { return; }

        var old_zoom = state.main_canvas.prev_zoom;
        var old_pixel_x = (this.x - state.canvas_wrapper.offsetLeft)/state.main_canvas.prev_zoom;
        var old_pixel_y = (this.y - state.canvas_wrapper.offsetTop)/state.main_canvas.prev_zoom;
        var new_zoom = state.main_canvas.current_zoom;

        var delta_x = old_pixel_x * new_zoom - old_pixel_x * old_zoom;
        var delta_y = old_pixel_y * new_zoom - old_pixel_y * old_zoom;

        var new_x = this.x + delta_x - canvas_wrapper.offsetLeft;
        var new_y = this.y + delta_y - canvas_wrapper.offsetTop;

        var new_w = this.w * new_zoom;
        var new_h = this.h * new_zoom;

        this.draw_selection(new_x, new_y, new_x + new_w, new_y + new_h);
    }
}