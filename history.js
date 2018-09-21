class History_Manager{
    constructor(){
        this.history = [];
        this.redo_history = [];
        this.prev_data = null;
        this.prev_selection = null;
        this.new_selection = null;
    }

    add_history(type, args){
        this.redo_history = []
        switch(type){
            case "pen-stroke":
                var new_data = state.current_layer.render_canvas.toDataURL();
                this.history.push(new Pen_Stroke(this.prev_data, new_data, state.current_layer.index));
                break;
            case "selection":
                if (this.prev_selection == null){ return; }
                this.history.push(new Selection_History(this.prev_selection, this.new_selection));
                this.prev_selection = null;
                this.new_selection = null;
                break;
            case "add-layer":
                this.history.push(new Add_Layer(...args))
                break;
            case "delete-layer":
                this.history.push(new Delete_Layer(...args))
                break;
            case "layer-visibility":
                this.history.push(new Layer_Visibility(...args));
                break;
            case "swap-layers":
                this.history.push(new Swap_Layers(...args));
                break;
            case "layer-settings":
                this.history.push(new Layer_Settings_History(...args));
                break;
            case "add-palette-color":
                this.history.push(new Add_Palette_Color(...args));
                break;
            case "delete-palette-color":
                this.history.push(new Delete_Palette_Color(...args));
                break;
        }
    }

    undo_last(){
        if(this.history.length == 0) { return; }
        this.history[this.history.length - 1].undo();
        this.redo_history.push(this.history.pop());
        
    }
    redo_last(){
        if(this.redo_history.length == 0) { return; }
        this.redo_history[this.redo_history.length - 1].redo();
        this.history.push(this.redo_history.pop());
    }
}

class Pen_Stroke{
    constructor(prev_data, new_data, layer_index){
        this.prev_data = prev_data;
        this.new_data = new_data;
        this.layer_index = layer_index;
    }

    undo(){
        var img = new Image();
        img.onload = this.preserve_scope(this);
        img.src = this.prev_data;
    }
    
    redo(){
        var img = new Image();
        img.onload = this.preserve_scope(this)
        img.src = this.new_data;
    }

    preserve_scope(owner){
        return function(){
            var layer = state.layer_manager.layers[owner.layer_index];
            layer.clear();
            layer.render_ctx.drawImage(this, 0, 0);
            state.canvas_handler.redraw_layers();
            state.canvas_handler.render_draw_canvas();
            state.preview_canvas.redraw();
        }
    }
}

class Selection_History{
    constructor(prev_selection, new_selection){
        this.prev_selection = prev_selection;
        this.new_selection = new_selection;
    }

    undo(){
        if (!this.prev_selection.exists) {
            state.selection.clear();
            return;
        }
        state.selection.editor_x = this.prev_selection.x + canvas_x();
        state.selection.editor_y = this.prev_selection.y + canvas_y();
        state.selection.w = this.prev_selection.w;
        state.selection.h = this.prev_selection.h;
        state.selection.selection_rect.style.width = this.prev_selection.w * state.zoom + "px";
        state.selection.selection_rect.style.height = this.prev_selection.h * state.zoom + "px";
        state.selection.exists = this.prev_selection.exists;
        state.selection.draw_selection((state.selection.editor_x - canvas_x()) / state.zoom,
                                              (state.selection.editor_y - canvas_y()) / state.zoom, 
                                              (state.selection.editor_x + state.selection.w * state.zoom - canvas_x()) / state.zoom, 
                                              (state.selection.editor_y + state.selection.h * state.zoom - canvas_y()) / state.zoom)
    }

    redo(){
        if (!this.new_selection.exists) {
            state.selection.clear();
            return;
        }
        state.selection.editor_x = this.new_selection.x + canvas_x();
        state.selection.editor_y = this.new_selection.y + canvas_y();
        state.selection.w = this.new_selection.w;
        state.selection.h = this.new_selection.h;
        state.selection.selection_rect.style.width = this.new_selection.w * state.zoom + "px";
        state.selection.selection_rect.style.height = this.new_selection.h * state.zoom + "px";
        state.selection.exists = this.new_selection.exists;
        state.selection.draw_selection((state.selection.editor_x - canvas_x()) / state.zoom,
                                               (state.selection.editor_y - canvas_y()) / state.zoom, 
                                               (state.selection.editor_x + state.selection.w * state.zoom - canvas_x()) / state.zoom, 
                                               (state.selection.editor_y + state.selection.h * state.zoom - canvas_y()) / state.zoom)
    }
}

class Add_Layer{
    constructor(index){
        this.index = index;
    }

    undo(){
        state.layer_manager.change_layer(this.index + 1);
        state.layer_manager.layers[this.index].delete();
        state.layer_manager.layers.splice(this.index, 1);
        state.layer_manager.update_layer_indices();
        state.current_layer
    }

    redo(){
        state.layer_manager.add_layer();
    }
}

class Delete_Layer{
    constructor(layer_state){
        this.layer_state = layer_state;
    }

    undo(){
        var new_layer = new Layer(this.layer_state.index, state.doc_w, state.doc_h);
        new_layer.index = this.layer_state.index;
        new_layer.name_elem.innerHTML = this.layer_state.name;
        
        
        state.layer_manager.layers.splice(new_layer.index, 0, new_layer);
        state.layer_manager.update_layer_indices();
        state.layer_manager.change_layer(new_layer.index);
        
        if(!this.layer_state.visible){
            new_layer.visible = false;
            new_layer.visibility_icon.className = "far fa-circle";
        }

        var img = new Image()
        img.onload = function(){
            new_layer.render_ctx.drawImage(this, 0, 0);
            state.canvas_handler.redraw_layers();
            state.canvas_handler.render_draw_canvas();
            state.preview_canvas.redraw();
        }
        img.src = this.layer_state.data;
    }

    redo(){
        state.layer_manager.layers[this.layer_state.index].delete();
        state.layer_manager.layers.splice(this.layer_state.index, 1);
        state.layer_manager.update_layer_indices();
        state.layer_manager.change_layer(0)
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
        state.preview_canvas.redraw();
    }
}

class Layer_Visibility{
    constructor(index){
        this.undo = this.redo = function(){
            state.layer_manager.layers[index].toggle_visibility(state.layer_manager.layers[index]).call();
        }
    }
}

class Swap_Layers{
    constructor(layer_a, layer_b){
        this.undo = this.redo = function(){
            state.layer_manager.swap_layers(layer_a, layer_b);
        }
    }
}

class Layer_Settings_History{
    constructor(prev_settings, new_settings, layer){
        this.prev_settings = prev_settings;
        this.new_settings = new_settings;
        this.layer = layer;
    }

    undo(){
        this.layer.opacity = this.prev_settings.opacity;
        this.layer.name_elem.innerHTML = this.prev_settings.name;
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
    }
    
    redo(){
        this.layer.opacity = this.new_settings.opacity;
        this.layer.name_elem.innerHTML = this.new_settings.name;
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
    }
}

class Add_Palette_Color{
    constructor(elem){
        this.elem = elem;
    }

    undo(){
        state.palette.remove_color(this.elem);
    }

    redo(){
        state.palette.colors.splice(this.elem.index, 0, this.elem);
        state.palette.wrapper.appendChild(this.elem);
        state.palette.reposition_colors();
    }
}

class Delete_Palette_Color{
    constructor(elem){
        this.elem = elem;
    }

    undo(){
        state.palette.colors.splice(this.elem.index, 0, this.elem);
        state.palette.wrapper.appendChild(this.elem);
        state.palette.reposition_colors();
    }

    redo(){
        state.palette.remove_color(this.elem);
    }
}