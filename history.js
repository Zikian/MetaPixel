class History_Manager{
    constructor(){
        this.history = [];
        this.redo_history = [];
        this.prev_data = null;
        this.prev_selection_state = null;
        
        this.prev_copy_data = null;

        this.prev_tile_data = [];
        this.prev_tile_indices = [];
        this.prev_tile_positions = [];
    }

    add_history(type, args){
        this.redo_history = []
        if(this.history.length > 80){
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
            case "tileset-settings":
                this.history.push(new Tileset_Settings_History(...args));
                break;
            case "add-animation":
                this.history.push(new Add_Animation());
                break;
            case "delete-animation":
                this.history.push(new Delete_Animation(...args));
                break;
            case "commit-selection":
                this.history.push(new Commit_Selection(this.prev_data, this.prev_tile_data, this.prev_copy_data));
                break;
            case "detach-selection":
                this.history.push(new Detach_Selection(this.prev_data, this.prev_tile_data, this.prev_selection_state));
                break;
            case "load-clipboard":
                this.history.push(new Load_Clipboard(this.prev_selection_state));
                break;
            case "paste-selection":
                this.history.push(new Paste_Selection(this.prev_data, this.prev_tile_data, this.prev_selection_state));
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
        state.frame_canvas.render();
    }
    
    redo(){
        state.layer_manager.layers[this.layer_index].draw_data(this.new_data)
        state.tile_manager.draw_data(this.new_tile_data);
        state.frame_canvas.render();
    }
}

class Selection_History{
    constructor(prev_selection_state){
        this.prev_selection_state = prev_selection_state;
        this.new_selection_state = state.selection.get_state();
    }

    undo(){
        state.selection.load_from_state(this.prev_selection_state);
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
    }
    
    redo(){
        state.selection.load_from_state(this.new_selection_state);
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
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
    constructor(layer_state, tilemap){
        this.layer_state = layer_state;
        this.tilemap = tilemap;
    }

    undo(){
        var new_layer = new Layer(this.layer_state.index);
        new_layer.index = this.layer_state.index;
        new_layer.name_elem.innerHTML = this.layer_state.name;
        new_layer.tilemap = this.tilemap;
        
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
        this.new_indices = this.positions.map(position => state.current_layer.tilemap[position[0] + position[1] * state.tiles_x]);
        this.layer_index = state.current_layer.index;
        this.prev_data = prev_data;
        this.new_data = state.current_layer.get_data();
    }

    undo(){
        var layer = state.layer_manager.layers[this.layer_index];
        for(var i = 0; i < this.positions.length; i++){
            var position = this.positions[i];
            layer.tilemap[position[0] + position[1] * state.tiles_x] = this.prev_indices[i];
        }
        state.tile_manager.update_tile_mappings(layer);
        layer.draw_data(this.prev_data);
    }
    
    redo(){
        var layer = state.layer_manager.layers[this.layer_index];
        for(var i = 0; i < this.positions.length; i++){
            var position = this.positions[i];
            layer.tilemap[position[0] + position[1 * state.tiles_x]] = this.new_indices[i];
        }
        state.tile_manager.update_tile_mappings(layer);
        layer.draw_data(this.new_data);
    }
}

class Delete_Tile{
    constructor(prev_painted_tiles, deleted_tile){
        this.prev_painted_tiles = prev_painted_tiles;
        this.new_painted_tiles = state.layer_manager.layers.map(layer => {
            return layer.tilemap.slice();
        })
        this.deleted_tile = deleted_tile;
    }

    undo(){
        state.tile_manager.tiles_body.appendChild(this.deleted_tile.canvas);
        state.tile_manager.tiles.splice(this.deleted_tile.index, 0, this.deleted_tile);
        state.tile_manager.update_tile_indices();
        state.layer_manager.layers.forEach((layer, i) => {
            layer.tilemap = this.prev_painted_tiles[i];
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
            layer.tilemap = this.new_painted_tiles[i];
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
        state.tile_manager.change_tile(0);
    }
    
    redo(){
        state.tile_manager.tiles.push(this.added_tile);
        state.tile_manager.tiles_body.appendChild(this.added_tile.canvas);
        state.tile_manager.change_tile(state.tile_manager.tiles.length - 1);
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

class Tileset_Settings_History{
    constructor(prev_tileset_w){
        this.prev_tileset_w = prev_tileset_w;
        this.new_tileset_w = state.tile_manager.tileset_w;
    }

    undo(){
        state.tile_manager.tileset_w = this.prev_tileset_w;
        state.tile_manager.tiles.forEach(tile => {
            tile.update_tileset_position();
        });
    }
    
    redo(){
        state.tile_manager.tileset_w = this.new_tileset_w;
        state.tile_manager.tiles.forEach(tile => {
            tile.update_tileset_position();
        });
    }
}

class Add_Animation{
    undo(){
        state.animator.delete_animation(state.animator.animations.length - 1);
    }

    redo(){
        state.animator.add_animation();
    }
}

class Delete_Animation{
    constructor(deleted_animation){
        this.deleted_animation = deleted_animation;
    }

    undo(){
        state.animator.animations.splice(this.deleted_animation.index, 0, this.deleted_animation);
        state.animator.animations_window_body.appendChild(this.deleted_animation.wrapper);
        state.animator.change_animation(this.deleted_animation.index);
        state.animator.reposition_animations();
    }

    redo(){
        state.animator.delete_animation(this.deleted_animation.index);
    }
}

class Commit_Selection{
    constructor(prev_data, prev_tile_data, prev_copy_data){
        this.new_selection_state = state.selection.get_state();
        this.pen_stroke = new Pen_Stroke(prev_data, prev_tile_data);
        this.copy_data = prev_copy_data;
        this.prev_selection_w = state.selection.prev_selection_w;
        this.prev_selection_h = state.selection.prev_selection_h;
    }

    undo(){
        this.pen_stroke.undo();

        state.selection.transform = true;
        state.selection.toggle_resizers();

        state.selection.copy_canvas.width = this.prev_selection_w;
        state.selection.copy_canvas.height = this.prev_selection_h;
        state.selection.copy_ctx.putImageData(this.copy_data, 0, 0);

        state.selection.draw_paste_canvas();

        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
        state.frame_canvas.render();
    }

    redo(){
        state.selection.load_from_state(this.new_selection_state);
        state.selection.draw_paste_canvas();
        state.selection.commit();
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
    }
}

class Detach_Selection{
    constructor(prev_data, prev_tile_data, prev_selection_state){
        this.prev_selection_state = prev_selection_state;
        this.pen_stroke = new Pen_Stroke(prev_data, prev_tile_data)
    }

    undo(){
        state.selection.transform = false;
        state.selection.toggle_resizers();

        this.pen_stroke.undo();
        state.selection.load_from_state(this.prev_selection_state);

        state.selection.copy_canvas.width = state.selection.copy_canvas.width
        state.selection.paste_canvas.width = state.selection.paste_canvas.width

        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
        state.frame_canvas.render();
    }

    redo(){
        state.selection.detach();
    }
}

class Paste_Selection{
    constructor(prev_data, prev_tile_data, prev_selection_state){
        this.prev_selection_state = prev_selection_state;
        this.new_selection_state = state.selection.get_state();
        this.pen_stroke = new Pen_Stroke(prev_data, prev_tile_data);
    }

    undo(){
        state.selection.load_from_state(this.prev_selection_state)
        this.pen_stroke.undo();
    }
    
    redo(){
        state.selection.load_from_state(this.new_selection_state)
        this.pen_stroke.redo();
    }
}

class Load_Clipboard{
    constructor(prev_selection_state){
        this.prev_selection_state = prev_selection_state;
    }

    undo(){
        state.selection.load_from_state(this.prev_selection_state);
        state.selection.transform = false;
        state.selection.toggle_resizers();

        state.selection.copy_canvas.width = state.selection.copy_canvas.width;
        state.selection.paste_canvas.width = state.selection.paste_canvas.width;

        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
    }

    redo(){
        state.selection.load_clipboard();
    }
}
