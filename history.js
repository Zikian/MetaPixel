class History_Manager{
    constructor(){
        this.history = [];
        this.redo_history = []
        this.prev_data = []
        this.new_data = []
        this.prev_selection = null;
        this.new_selection = null;
    }

    add_history(type){
        if (this.prev_data.length == 0 && this.prev_selection == null){ return; }
        this.redo_history = []
        if(type == "pen-stroke" || type == "erase" || type == "line" || type == "rectangle" || type == "fill" || type == "clear-selection"){
            if (this.prev_data.length != 0){
                this.history.push(new Pen_Stroke(this.prev_data, this.new_data, state.main_canvas.current_layer.index));
                this.prev_data = [];
                this.new_data = [];
            }
        }
        if(type == "selection"){
            this.history.push(new Selection_History(this.prev_selection, this.new_selection));
            this.prev_selection = null;
            this.new_selection = null;
        }
    }

    undo_last(){
        if(this.history.length == 0) { return; }
        this.history[this.history.length - 1].undo();
        this.redo_history.push(this.history.pop());
        this.prev_data = []
        state.preview_canvas.redraw();
    }

    redo_last(){
        if(this.redo_history.length == 0) { return; }
        this.redo_history[this.redo_history.length - 1].redo();
        this.history.push(this.redo_history.pop());
        state.preview_canvas.redraw();
    }

    push_prev_data(data){
        this.prev_data.push(get_data_copy(data));
    }

    push_new_data(data){
        this.new_data.push(get_data_copy(data));
    }
}

class Pen_Stroke{
    constructor(prev_data, new_data, layer){
        this.prev_data = prev_data;
        this.new_data = new_data;
        this.layer = layer;
    }

    undo(){
        for(var i = 0; i < this.prev_data.length; i++){
            var pos = this.prev_data[i].pos;
            state.main_canvas.layers[this.layer].draw_pixel(rgba(this.prev_data[i].rgba), ...pos);
            var data = state.main_canvas.layers[this.layer].data[pos[0]][pos[1]]
            data = this.prev_data[i];
        }
    }

    redo(){
        for(var i = 0; i < this.new_data.length; i++){
            var pos = this.new_data[i].pos;
            state.main_canvas.layers[this.layer].draw_pixel(rgba(this.new_data[i].rgba), ...pos);
            var data = state.main_canvas.layers[this.layer].data[pos[0]][pos[1]]
            data = get_data_copy(this.new_data[i]);
        }
    }
}

function get_data_copy(data){
    var copy = new Pixel_Data();
    copy.pos = data.pos;
    copy.rgba = data.rgba
    return copy;
}

class Selection_History{
    constructor(prev_selection, new_selection){
        this.prev_selection = prev_selection;
        this.new_selection = new_selection;
    }

    undo(){
        if (!this.prev_selection.exists) {
            state.current_selection.clear();
            return;
        }
        state.current_selection.x = this.prev_selection.x;
        state.current_selection.y = this.prev_selection.y;
        state.current_selection.w = this.prev_selection.w;
        state.current_selection.h = this.prev_selection.h;
        state.current_selection.true_w = this.prev_selection.true_w;
        state.current_selection.true_h = this.prev_selection.true_h;
        state.current_selection.exists = this.prev_selection.exists;
        state.current_selection.draw_selection(this.prev_selection.x - state.canvas_wrapper.offsetLeft,
                                               this.prev_selection.y - state.canvas_wrapper.offsetTop, 
                                               this.prev_selection.x + this.prev_selection.true_w - state.canvas_wrapper.offsetLeft, 
                                               this.prev_selection.y + this.prev_selection.true_h - state.canvas_wrapper.offsetTop)
    }

    redo(){
        if (!this.new_selection.exists) {
            state.current_selection.clear();
            return;
        }
        state.current_selection.x = this.new_selection.x;
        state.current_selection.y = this.new_selection.y;
        state.current_selection.w = this.new_selection.w;
        state.current_selection.h = this.new_selection.h;
        state.current_selection.true_w = this.new_selection.true_w;
        state.current_selection.true_h = this.new_selection.true_h;
        state.current_selection.exists = this.new_selection.exists;
        state.current_selection.draw_selection(this.new_selection.x - state.canvas_wrapper.offsetLeft,
                                               this.new_selection.y - state.canvas_wrapper.offsetTop, 
                                               this.new_selection.x + this.new_selection.true_w - state.canvas_wrapper.offsetLeft, 
                                               this.new_selection.y + this.new_selection.true_h - state.canvas_wrapper.offsetTop)
    }
}

class Layer_Change{
    constructor(origin,){
        this.origin = origin;
    }


    undo(){
        if (this.origin == "add-layer"){
        }
    }
}