class Selection{
    constructor(){
        this.editor_x = 0;
        this.editor_y = 0;
        this.w = 0;
        this.h = 0;

        this.prevent_doubleclick = false;

        // Check if selection exists
        this.exists = false;

        // Check if selection is being made
        this.forming = false;

        // Checl if the user is dragging a selection
        this.being_dragged = false;

        this.selection_rect = document.getElementById("selection-rect");
        
        this.wrap_around_canvas();
    }

    width(){ return this.w * state.zoom; }

    height(){ return this.h * state.zoom; }

    get_selection_info(){
        return {
            x: this.editor_x - canvas_x(), // Subtract canvas position to account for canvas movement between undo/redo
            y: this.editor_y - canvas_y(),
            w: this.w,
            h: this.h,
            exists: this.exists
        }
    }

    draw(){
        if(state.input.shift){
            state.selection_end = rect_to_square(...state.selection_start, ...state.selection_end);
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
        this.editor_x = x1 * state.zoom + canvas_x();
        this.editor_y = y1 * state.zoom + canvas_y();
        this.w = w;
        this.h = h;
        this.exists = true;

        this.selection_rect.style.left = this.editor_x + "px";
        this.selection_rect.style.top = this.editor_y + "px"
        this.selection_rect.style.width = w * state.zoom + "px";
        this.selection_rect.style.height = h * state.zoom + "px";

        this.selection_rect.style.display = "block";
    }

    get_intersection(){
        if(!this.exists) { return; }
        var x1 = (Math.max(this.editor_x,  canvas_x()) - canvas_x()) / state.zoom;
        var y1 = (Math.max(this.editor_y, canvas_y()) - canvas_y()) / state.zoom;
        var x2 = (Math.min(this.editor_x + this.width(),  canvas_x() + canvas_w()) - canvas_x()) / state.zoom;
        var y2 = (Math.min(this.editor_y + this.height(),  canvas_y() + canvas_h()) - canvas_y()) / state.zoom;
        
        // Selection is outside of canvas
        if(x2 <= x1 || y2 <= y1){
            this.clear();
            return;
        }
        
        this.draw_selection(x1, y1, Math.round(x2), Math.round(y2));
    }

    clear(){
        this.exists = false;
        this.wrap_around_canvas();
    }
    
    wrap_around_canvas(){
        this.selection_rect.style.display = "none";
        this.editor_x = canvas_x();
        this.editor_y = canvas_y();
        this.w = state.doc_w;
        this.h = state.doc_h;
    }

    contains_pixel(x, y){
        var pos_x = (this.editor_x - canvas_x())/state.zoom;
        var pos_y = (this.editor_y - canvas_y())/state.zoom;
        return (x >= pos_x && 
                y >= pos_y && 
                x < pos_x + this.w && 
                y < pos_y + this.h)
    }

    move(x, y){
        this.editor_x += x;
        this.editor_y += y;
        this.selection_rect.style.left = this.editor_x + "px";
        this.selection_rect.style.top = this.editor_y + "px";
    }

    drag(){
        this.editor_x += state.delta_pixel_pos[0] * state.zoom;
        this.editor_y += state.delta_pixel_pos[1] * state.zoom;
        this.selection_rect.style.left = this.editor_x + "px";
        this.selection_rect.style.top = this.editor_y + "px";
    }

    resize(){
        if(!this.exists) { 
            this.wrap_around_canvas();
            return;
        }
        
        var old_pixel_x = (this.editor_x - canvas_x()) / state.prev_zoom;
        var old_pixel_y = (this.editor_y - canvas_y()) / state.prev_zoom;
        
        var delta_x = old_pixel_x * state.zoom - old_pixel_x * state.prev_zoom;
        var delta_y = old_pixel_y * state.zoom - old_pixel_y * state.prev_zoom;  

        var new_x = (this.editor_x + delta_x - canvas_x()) / state.zoom;
        var new_y = (this.editor_y + delta_y - canvas_y()) / state.zoom;

        this.draw_selection(new_x, new_y, new_x + this.w, new_y + this.h);
    }
}