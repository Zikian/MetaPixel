class History_Manager{
    constructor(){
        this.history = [];
        this.redo_history = [];
        this.prev_data = null;
        this.prev_selection_state = null;
        
        this.prev_tile_data = [];
        this.prev_tile_indices = [];
        this.prev_tile_positions = [];
    }

    add_history(type, args){
        this.redo_history = []
        if(this.history.length > 30){
            this.history.shift();
        }
        switch(type){
            case "pen-stroke":
                this.history.push(new Pen_Stroke(this.prev_data, this.prev_tile_data));
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
                this.history.push(new Paint_Tile(...args, this.prev_data, this.prev_tile_positions, this.prev_tile_indices));
                this.prev_tile_indices = [];
                this.prev_tile_positions = [];
                break;
            case "delete-tile":
                this.history.push(new Delete_Tile(...args))
                break;
            case "add-tile":
                this.history.push(new Add_Tile(...args))
                break;
            case "swap-tiles":
                this.history.push(new Swap_Tiles(...args));
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
    constructor(prev_data, prev_tile_data){
        this.prev_data = prev_data;
        this.new_data = state.current_layer.get_data();
        this.layer_index = state.current_layer.index;
        this.prev_tile_data = prev_tile_data;
        this.new_tile_data = state.tile_manager.get_tile_data();
    }

    undo(){
        state.layer_manager.layers[this.layer_index].draw_data(this.prev_data);
        state.tile_manager.draw_data(this.prev_tile_data);
    }
    
    redo(){
        state.layer_manager.layers[this.layer_index].draw_data(this.new_data)
        state.tile_manager.draw_data(this.new_tile_data);
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
    constructor(layer_state, painted_tiles){
        this.layer_state = layer_state;
        this.painted_tiles = painted_tiles;
    }

    undo(){
        var new_layer = new Layer(this.layer_state.index);
        new_layer.index = this.layer_state.index;
        new_layer.name_elem.innerHTML = this.layer_state.name;
        new_layer.painted_tiles = this.painted_tiles;
        
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
    constructor(prev_data, positions, prev_indices){
        this.positions = positions;
        this.prev_indices = prev_indices;
        this.new_indices = this.positions.map(position => state.current_layer.painted_tiles[position[0] + position[1] * state.tiles_x]);
        this.layer_index = state.current_layer.index;
        this.prev_data = prev_data;
        this.new_data = state.current_layer.get_data();
    }

    undo(){
        var layer = state.layer_manager.layers[this.layer_index];
        for(var i = 0; i < this.positions.length; i++){
            var position = this.positions[i];
            layer.painted_tiles[position[0] + position[1] * state.tiles_x] = this.prev_indices[i];
        }
        state.tile_manager.update_tile_mappings(layer);
        layer.draw_data(this.prev_data);
    }
    
    redo(){
        var layer = state.layer_manager.layers[this.layer_index];
        for(var i = 0; i < this.positions.length; i++){
            var position = this.positions[i];
            layer.painted_tiles[position[0] + position[1 * state.tiles_x]] = this.new_indices[i];
        }
        state.tile_manager.update_tile_mappings(layer);
        layer.draw_data(this.new_data);
    }
}

class Delete_Tile{
    constructor(prev_painted_tiles, deleted_tile){
        this.prev_painted_tiles = prev_painted_tiles;
        this.new_painted_tiles = state.layer_manager.layers.map(layer => {
            return layer.painted_tiles.slice();
        })
        this.deleted_tile = deleted_tile;
    }

    undo(){
        state.tile_manager.tiles_body.appendChild(this.deleted_tile.canvas);
        state.tile_manager.tiles.splice(this.deleted_tile.index, 0, this.deleted_tile);
        state.tile_manager.update_tile_indices();
        state.layer_manager.layers.forEach((layer, i) => {
            layer.painted_tiles = this.prev_painted_tiles[i];
        });
        state.tile_manager.update_tile_mappings(state.current_layer);
        state.tile_manager.change_tile(this.deleted_tile.index);
        state.tile_manager.reposition_tiles();
    }
    
    redo(){
        this.deleted_tile.delete();
        state.tile_manager.tiles.splice(this.deleted_tile.index, 1);
        state.tile_manager.update_tile_indices();
        state.layer_manager.layers.forEach((layer, i) => {
            layer.painted_tiles = this.new_painted_tiles[i];
        });
        state.tile_manager.update_tile_mappings(state.current_layer);
        state.tile_manager.change_tile(0);
        state.tile_manager.reposition_tiles();
    }
}

class Add_Tile{
    constructor(added_tile){
        this.added_tile = added_tile;
    }

    undo(){
        this.added_tile.delete();
        state.tile_manager.tiles.pop();
    }

    redo(){
        state.tile_manager.tiles.push(this.added_tile);
        state.tile_manager.tiles_body.appendChild(this.added_tile.canvas);
    }
}

class Swap_Tiles{
    constructor(index_a, index_b){
        this.index_a = index_a;
        this.index_b = index_b;

        this.undo = this.redo = function(){
            state.tile_manager.swap_tiles(this.index_a, this.index_b)
        }
    }
}