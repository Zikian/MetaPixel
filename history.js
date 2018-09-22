class History_Manager{
    constructor(){
        this.history = [];
        this.redo_history = [];
        this.prev_data = null;
        this.prev_selection_state = null;
    }

    add_history(type, args){
        this.redo_history = []
        switch(type){
            case "pen-stroke":
                this.history.push(new Pen_Stroke(this.prev_data));
                break;
            case "selection":
                if (this.prev_selection_state == null){ return; }
                this.history.push(new Selection_History(this.prev_selection_state));
                this.prev_selection_state = null;
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
                case "paint-tile":
                this.history.push(new Paint_Tile(...args));
                this.prev_painted_tiles = null;
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
    constructor(prev_data){
        this.prev_data = prev_data;
        this.new_data = state.current_layer.get_data();
        this.layer_index = state.current_layer.index;
    }

    undo(){
        state.layer_manager.layers[this.layer_index].draw_data(this.prev_data)
    }
    
    redo(){
        state.layer_manager.layers[this.layer_index].draw_data(this.new_data)
    }
}

class Selection_History{
    constructor(prev_selection_state){
        this.prev_selection_state = prev_selection_state;
        this.new_selection_state = state.selection.get_state();
    }

    undo(){
        state.selection.load_from_state(this.prev_selection_state);
    }

    redo(){
        state.selection.load_from_state(this.new_selection_state);
    }
}

class Add_Layer{
    constructor(index){
        this.index = index;
    }

    undo(){
        state.layer_manager.delete_layer(this.index)
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
        var new_layer = new Layer(this.layer_state.index);
        new_layer.index = this.layer_state.index;
        new_layer.name_elem.innerHTML = this.layer_state.name;
        
        state.layer_manager.layers.splice(new_layer.index, 0, new_layer);
        state.layer_manager.update_layer_indices();
        state.layer_manager.change_layer(new_layer.index);
        
        if(!this.layer_state.visible){ new_layer.toggle_visibility(); }
        new_layer.draw_data(this.layer_state.data);
    }

    redo(){
        state.layer_manager.delete_layer(this.layer_state.index);
    }
}

class Layer_Visibility{
    constructor(index){
        this.undo = this.redo = function(){
            state.layer_manager.layers[index].toggle_visibility(state.layer_manager.layers[index]);
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
    constructor(prev_settings, new_settings, layer_index){
        this.prev_settings = prev_settings;
        this.new_settings = new_settings;
        this.layer_index = layer_index;
    }

    undo(){
        state.layer_manager.layers[this.layer_index].update_settings(this.prev_settings);
    }
    
    redo(){
        state.layer_manager.layers[this.layer_index].update_settings(this.new_settings);
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

class Paint_Tile{
    constructor(position, prev_index){
        this.position = position;
        this.prev_index = prev_index;
        this.new_index = state.current_layer.painted_tiles[position[0]][position[1]];
        this.layer_index = state.current_layer.index;
        this.pen_stroke = new Pen_Stroke(state.history_manager.prev_data);
    }

    undo(){
        this.pen_stroke.undo();
        state.layer_manager.layers[this.layer_index].painted_tiles[this.position[0]][this.position[1]] = this.prev_index;
        state.tile_manager.update_tile_mappings(state.layer_manager.layers[this.layer_index]);
    }
    
    redo(){
        this.pen_stroke.redo();
        state.layer_manager.layers[this.layer_index].painted_tiles[this.position[0]][this.position[1]] = this.new_index;
        state.tile_manager.update_tile_mappings(state.layer_manager.layers[this.layer_index]);
    }
}