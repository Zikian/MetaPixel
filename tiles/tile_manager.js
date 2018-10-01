class Tile_Manager{
    constructor(){
        this.zoom = 2;
        this.zoom_stages = [1, 2, 4, 6];
        
        this.tiles = [];
        this.current_tile = null;

        this.tileset_w = 4;
        this.tileset_h = 4;

        this.tiles_body = document.getElementById("tiles-body");

        var resizer = document.getElementById("tiles-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = resize_sidebar_window(document.getElementById("tiles-body"));
        
        this.add_tile_button = document.getElementById("add-tile");
        var owner = this;
        this.add_tile_button.onclick = function(){ 
            owner.add_tile(); 
            state.history_manager.add_history("add-tile", [owner.tiles.slice(-1)[0]]);
        };

        this.zoom_tileset_in_button = document.getElementById("zoom-tileset-in");
        this.zoom_tileset_in_button.onclick = function(){
            owner.zoom_tileset("in");
        }

        this.zoom_tileset_out_button = document.getElementById("zoom-tileset-out");
        this.zoom_tileset_out_button.onclick = function(){
            owner.zoom_tileset("out");
        }

        this.delete_tile_button = document.getElementById("remove-tile")
        this.delete_tile_button.onclick = function(){ 
            if(owner.tiles.length == 0) { return; }
            owner.delete_tile(owner.current_tile); 
        }

        this.duplicate_tile_button = document.getElementById("duplicate-tile");
        this.duplicate_tile_button.onclick = function(){
            if(state.tile_manager.current_tile != null){
                state.tile_manager.duplicate_tile(state.tile_manager.current_tile)    
            }
        }
        
        this.tile_indices = new Array(state.tiles_x);
        for(var x = 0; x < state.tiles_x; x++){
            this.tile_indices[x] = [];
            for(var y = 0; y < state.tiles_y; y++){
                var index_elem = document.createElement("span");
                index_elem.innerHTML = "X";
                index_elem.className = "tile-index";
                this.tile_indices[x].push(index_elem);
                state.editor.appendChild(index_elem)
            }
        }

        this.empty_tile = new Tile(null, 0);

        this.indices_visible = true;
        this.reposition_indices()
    }

    get_target_swap_tile(mouse_x, mouse_y){
        var relative_x = mouse_x - this.tiles_body.getBoundingClientRect().x;
        var relative_y = mouse_y - this.tiles_body.getBoundingClientRect().y;
        for(var i = 0; i < this.tiles.length; i++){
            var tile = this.tiles[i];
            if(tile.canvas != state.active_element) {
                var tile_x = tile.canvas.offsetLeft;
                var tile_y = tile.canvas.offsetTop;
                if(tile_x <= relative_x && 
                   tile_y <= relative_y && 
                   relative_x <= tile_x + state.tile_w * this.zoom && 
                   relative_y <= tile_y + state.tile_h * this.zoom){
                    return tile.index;
                }
            }
        }
    }
    
    swap_tiles(index_a, index_b){
        this.tiles[index_a].canvas.style.boxShadow = "none";
        this.tiles[index_a].canvas.style.zIndex = "0";
        if(index_a == index_b || index_b == null) { 
            this.tiles[index_a].update_tileset_position();
            return; 
        }

        var layers_where_painted = [];
        state.layer_manager.layers.forEach(layer => {
            if(layer.painted_tiles.includes(index_a) || layer.painted_tiles.includes(index_b)){
                layers_where_painted.push(layer.index);
            }
        })

        layers_where_painted.forEach(layer_index => {
            var layer = state.layer_manager.layers[layer_index];
            layer.painted_tiles = layer.painted_tiles.map(painted_tile => {
                if(painted_tile == index_a){
                    return index_b;
                } else if (painted_tile == index_b){
                    return index_a
                } 
                return painted_tile;
            })
        })
        
        this.tiles.swapItems(index_a, index_b);
        this.update_tile_indices();

        this.tiles[index_a].update_tileset_position();
        this.tiles[index_b].update_tileset_position();

        this.update_tile_mappings(state.current_layer);
    }

    get_tile_data(){
        var data = []
        this.tiles.forEach(tile => {
            data.push(tile.canvas.toDataURL());
        })
        return data;
    }

    draw_data(data){
        var index = 0;
        this.tiles.forEach(tile => {
            tile.ctx.clearRect(0, 0, state.tile_w, state.tile_h);
            var img = new Image();
            img.onload = function(){
                tile.ctx.drawImage(this, 0, 0);
            }
            img.src = data[index];
            index++;
        })
    }

    get_containing_tile(x, y){
        //Get the position of the tile containing pixel position (x, y) on the canvas
        x = Math.floor(x / state.tile_w);
        y = Math.floor(y / state.tile_h); 
        if(x < 0 || y < 0 || x >= state.tiles_x || y >= state.tiles_y){
            return;
        }
        return [x, y];
    }

    get_containing_tiles(x, y, w, h){
        return {
            start_x: Math.floor(x / state.tile_w),
            end_x: Math.floor((x + w - 1) / state.tile_w),
            start_y: Math.floor(y / state.tile_h),
            end_y: Math.floor((y + h - 1) / state.tile_h)
        }
    }

    reposition_indices(){
        var x = this.tile_indices.length;
        var index_elem = null;
        while(x--){
            var y = this.tile_indices[x].length;
            while(y--){
                index_elem = this.tile_indices[x][y];
                index_elem.style.left = x * state.tile_w * state.zoom + canvas_x() + 4 + "px";
                index_elem.style.top = y * state.tile_h * state.zoom + canvas_y() + "px";
            }
        }
    }

    add_tile(){
        var new_tile = new Tile(this.tiles.length, this.zoom);
        this.tiles.push(new_tile);
        this.change_tile(new_tile.index)
    }

    delete_tile(tile){
        state.history_manager.removed_tile = tile;

        //Array containing indices of each layer where the tile is painted
        var layers_where_painted = [];
        state.layer_manager.layers.forEach(layer => {
            if(layer.painted_tiles.includes(tile.index)){
                layers_where_painted.push(layer.index);
            }
        })

        var prev_painted_tiles = [];
        //For each of the layers, add layer's painted tiles to prev_painted_tiles
        //and delete the reference to the tile's index in painted tiles
        state.layer_manager.layers.forEach(layer => {
            prev_painted_tiles.push(layer.painted_tiles);
            layer.painted_tiles = layer.painted_tiles.map(painted_tile => {
                if(painted_tile == tile.index){
                    return null;
                } else if (painted_tile > tile.index) {
                    return painted_tile - 1;
                }
                return painted_tile;
            })
        })
        
        this.update_tile_mappings(state.current_layer);
        tile.delete();
        this.tiles.splice(tile.index, 1);
        this.current_tile = this.tiles[0];
        
        this.update_tile_indices();
        this.reposition_tiles();

        state.history_manager.add_history("delete-tile", [prev_painted_tiles, tile]);
    }

    duplicate_tile(tile){
        var new_tile = new Tile(this.tiles.length, this.zoom);
        new_tile.ctx.drawImage(tile.canvas, 0, 0);
        this.tiles.push(new_tile);
        this.change_tile(new_tile.index);
        state.history_manager.add_history("add-tile", [this.tiles.slice(-1)[0]]);
    }

    reposition_tiles(){
        this.tiles.forEach(tile => {
            tile.update_tileset_position();
        })
    }

    change_tile(index){
        if(this.current_tile != null){
            this.current_tile.canvas.style.outline = "none";
        }
        this.current_tile = this.tiles[index];
        this.current_tile.canvas.style.outline = "2px solid black";
    }

    place_tile(tile, x, y){
        var prev_index = state.current_layer.painted_tiles[x + y * state.tiles_x];
        if(tile.index == null){
            this.tile_indices[x][y].innerHTML = "X";
            this.tiles[prev_index].remove_position(x, y);
        } else {
            this.tile_indices[x][y].innerHTML = tile.index;
            tile.painted_positions.push([x, y])
        }
        state.current_layer.painted_tiles[x + y * state.tiles_x] = tile.index;
    }

    update_tile_mappings(layer){
        this.clear_tile_positions();
        for(var x = 0; x < state.tiles_x; x++){
            for(var y = 0; y < state.tiles_y; y++){
                var index = layer.painted_tiles[x + y * state.tiles_x];
                if(index != null){
                    this.tile_indices[x][y].innerHTML = index;
                    this.tiles[index].painted_positions.push([x, y]);
                } else {
                    this.tile_indices[x][y].innerHTML = "X"
                }
            }
        }
    }

    update_tile_indices(){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].index = i;
        }
    }

    toggle_indices(){
        for(var x = 0; x < state.tiles_x; x++){
            for(var y = 0; y < state.tiles_y; y++){
                if(this.indices_visible){
                    this.tile_indices[x][y].style.display = "none";
                } else {
                    this.tile_indices[x][y].style.display = "block";
                }
            }
        }
        this.indices_visible = !this.indices_visible;
    }

    zoom_tileset(direction){
        var zoom_stage_index = this.zoom_stages.indexOf(this.zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }

        this.tiles.forEach(tile => {
            tile.canvas.style.width = state.tile_w * this.zoom + "px";
            tile.canvas.style.height = state.tile_h * this.zoom + "px";
            tile.update_tileset_position();
        })
    }

    clear_tile_positions(){
        this.tiles.forEach(tile => { tile.painted_positions = [] });
    }
}

class Tile{
    constructor(index, zoom){
        this.index = index;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        //Accounting for empty_tile 
        if(this.index == null) { return; }
        this.canvas.width = state.tile_w;
        this.canvas.height = state.tile_h;
        this.canvas.style.width = state.tile_w * zoom + "px";
        this.canvas.style.height = state.tile_h * zoom + "px";
        this.update_tileset_position();

        var owner = this;
        this.canvas.onmousedown = function(){
            state.active_element = this;
            this.style.zIndex = "10";
            this.owner_tile_index = owner.index;
        }
        this.canvas.mousedrag_actions = function(){
            this.style.boxShadow = "0px 0px 14px 2px rgba(0,0,0,0.75)"
            this.style.left = event.clientX - state.tile_manager.tiles_body.getBoundingClientRect().x - state.tile_w / 2 * state.tile_manager.zoom + "px";
            this.style.top = event.clientY - state.tile_manager.tiles_body.getBoundingClientRect().y - state.tile_h / 2 * state.tile_manager.zoom + "px";
        }

        this.canvas.className = "tile";

        var owner = this;
        this.canvas.onclick = function(){
            state.tile_manager.change_tile(owner.index);
            state.tool_handler.change_tool("tile_painter")
        }

        state.tile_manager.tiles_body.appendChild(this.canvas);

        //Array containing the positions at which this tile is painted
        this.painted_positions = [];
    }
    update_tileset_position(){
        this.canvas.style.left = this.index % state.tile_manager.tileset_w * state.tile_w  * state.tile_manager.zoom + "px";
        this.canvas.style.top =  Math.floor(this.index / state.tile_manager.tileset_w) * state.tile_w * state.tile_manager.zoom + "px";

    }

    remove_position(x, y){
        var position_index = this.painted_positions.length;
        while(position_index--){
            var position = this.painted_positions[position_index];
            if(position[0] == x && position[1] == y){
                this.painted_positions.splice(position_index, 1);
            }
        }
    }

    delete(){
        if(this.index == null) { return; }
        state.tile_manager.tiles_body.removeChild(this.canvas);
    }
}
