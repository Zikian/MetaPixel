class Selection{
    constructor(){
        this.x = 0;
        this.y = 0;
        this.w = state.doc_w;
        this.h = state.doc_h;

        this.exists = false;
        this.forming = false;
        this.being_dragged = false;

        this.selection_rect = document.getElementById("selection-rect");

        this.prev_state = null;
    }

    get_state(){
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            exists: this.exists
        }
    }

    load_from_state(new_state){
        if(!new_state.exists){ this.clear(); return; }
        this.draw_selection(new_state.x, new_state.y, new_state.w, new_state.h)
    }

    save(){
        this.prev_state = this.get_state();
    }

    restore(){
        this.load_from_state(this.prev_state);
    }

    form_selection(){
        if(state.input.shift){
            state.selection_end = rect_to_square(...state.selection_start, ...state.selection_end);
        }

        var x = Math.min(state.selection_start[0], state.selection_end[0]);
        var y = Math.min(state.selection_start[1], state.selection_end[1]);
        var w = Math.max(state.selection_start[0], state.selection_end[0]) - x + 1;
        var h = Math.max(state.selection_start[1], state.selection_end[1]) - y + 1;
        this.draw_selection(x, y, w, h)
    }

    draw_selection(x, y, w, h){
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.exists = true;

        this.selection_rect.style.left = x * state.zoom + canvas_x() + 1 + "px";
        this.selection_rect.style.top = y * state.zoom + canvas_y() + 0.5 + "px"
        this.selection_rect.style.width = w * state.zoom - 1 + "px";
        this.selection_rect.style.height = h * state.zoom - 0.5 + "px";

        this.selection_rect.style.display = "block";

        state.frame_canvas.update_selection();
    }

    get_intersection(){
        if(!this.exists) { this.clear(); return }
        var x = Math.max(this.x, 0);
        var y = Math.max(this.y, 0);
        var w = Math.min(this.x + this.w, state.doc_w) - x;
        var h = Math.min(this.y + this.h, state.doc_h) - y;
        (w <= 0 || h <= 0) ? this.clear() : this.draw_selection(x, y, w, h);
    }

    clear(){
        this.draw_selection(0, 0, state.doc_w, state.doc_h);
        this.exists = false;
        this.selection_rect.style.display = "none";
    }

    contains_mouse(){
        return (state.pixel_pos[0] >= this.x && 
                state.pixel_pos[1] >= this.y && 
                state.pixel_pos[0] < this.x + this.w && 
                state.pixel_pos[1] < this.y + this.h)
    }

    update(){
        if(!this.exists) { this.clear(); return; }
        this.draw_selection(this.x, this.y, this.w, this.h);   
    }

    drag(){
        this.x += state.delta_pixel_pos[0];
        this.y += state.delta_pixel_pos[1];
        this.draw_selection(this.x, this.y, this.w, this.h);
    }

    clip_to_frame(){
        this.x = Math.max(this.x, state.frame_pos[0]);
        this.y = Math.max(this.y, state.frame_pos[1]);
        this.w = Math.min(this.x + this.w, state.frame_pos[0] + state.tile_w) - this.x;
        this.h = Math.min(this.y + this.h, state.frame_pos[1] + state.tile_h) - this.y;
    }
}
