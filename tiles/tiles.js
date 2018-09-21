class Tile_Manager{
    constructor(){
        
        this.tiles = [];
        this.current_tile = null;

        this.tiles_wrapper = document.getElementById("tiles-wrapper");

        var resizer = document.getElementById("tiles-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = resize_sidebar_window(document.getElementById("tiles-body"));
        
        this.add_tile_button = document.getElementById("add-tile");
        var this_instance = this;
        this.add_tile_button.onclick = function(){ this_instance.add_tile(); };
        
        this.tile_indices = new Array(state.tiles_x);
        for(var x = 0; x < state.tiles_x; x++){
            this.tile_indices[x] = [];
            for(var y = 0; y < state.tiles_y; y++){
                var index_elem = document.createElement("span");
                index_elem.innerHTML = "X";
                index_elem.className = "tile-index";
                index_elem.x = x;
                index_elem.y = y;
                index_elem.index = null;
                this.tile_indices[x].push(index_elem);
                state.editor.appendChild(index_elem)
            }
        }
        this.reposition_indices()
    }

    get_containing_tile(x, y){
        //Get the position of the tile containing pixel position (x, y) on the canvas
        x = Math.floor(x / state.tile_w);
        y = Math.floor(y / state.tile_h); 
        if(x < 0 || y < 0 || x >= state.tiles_x || y >= state.tiles_y){
            x, y = null;
        }
        return {
            x: x,
            y: y
        }
    }

    reposition_indices(){
        var x = this.tile_indices.length;
        while(x--){
            this.tile_indices[x].forEach(index_elem => {
                index_elem.style.left = index_elem.x * state.tile_w * state.zoom + canvas_x() + 4 + "px";
                index_elem.style.top = index_elem.y * state.tile_h * state.zoom + canvas_y() + "px";
            });
        }
    }

    add_tile(){
        var new_tile = new Tile(this.tiles.length);
        this.current_tile = new_tile;
        this.tiles.push(new_tile);

        var layer = state.layer_manager.layers.length;
        while(layer--){
            state.layer_manager.layers[layer].painted_tiles.push([])
        }
    }

    change_tile(index){
        this.current_tile.canvas.style.outline = "none";
        this.current_tile = this.tiles[index];
        this.current_tile.canvas.style.outline = "2px solid black";
    }

    clear_tile_mappings(){
        var x = this.tile_indices.length;
        var y = null
        while(x--){
            y = this.tile_indices[x].length;
            while(y--){
                this.tile_indices[x][y].index = null;
                this.tile_indices[x][y].innerHTML = "X";
            }
        }
    }

    update_tile_mappings(layer){
        var tile = layer.painted_tiles.length;
        var position_index = null;
        while(tile--){
            position_index = layer.painted_tiles[tile].length;
            while(position_index--){
                var position = layer.painted_tiles[tile][position_index];
                this.tile_indices[position[0]][position[1]].index = tile;
                this.tile_indices[position[0]][position[1]].innerHTML = tile;
            }
        }
    }
}

class Tile{
    constructor(index){
        this.index = index;
        this.canvas = document.createElement("canvas");
        this.canvas.width = state.tile_w;
        this.canvas.height = state.tile_h;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.className = "tile";
        this.canvas.style.position = "relative";
        this.canvas.style.display = "inline-block"

        var this_instance = this;
        this.canvas.onclick = function(){
            state.tile_manager.change_tile(this_instance.index);
            state.tool_handler.change_tool("tile_placer")
        }

        state.tile_manager.tiles_wrapper.appendChild(this.canvas);
    }

    test(){
        console.log(this.index)
    }
}




