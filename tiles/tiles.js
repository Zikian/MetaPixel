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
                this.tile_indices[x].push(index_elem);
                state.editor.appendChild(index_elem)
            }
        }
        this.indices_visible = true;
        this.reposition_indices()
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
            x, y = null;
        }
        return {
            x: x,
            y: y
        }
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
        var new_tile = new Tile(this.tiles.length);
        this.current_tile = new_tile;
        this.tiles.push(new_tile);
    }

    change_tile(index){
        this.current_tile.canvas.style.outline = "none";
        this.current_tile = this.tiles[index];
        this.current_tile.canvas.style.outline = "2px solid black";
    }

    place_tile(tile, x, y){
        var new_index = tile.index; 
        this.tile_indices[x][y].innerHTML = new_index;
        tile.painted_positions.push([x, y])
        state.current_layer.painted_tiles[x][y] = new_index;
    }

    update_tile_mappings(layer){
        this.clear_tile_positions();
        for(var x = 0; x < state.tiles_x; x++){
            for(var y = 0; y < state.tiles_y; y++){
                var index = layer.painted_tiles[x][y];
                if(index != null){
                    this.tile_indices[x][y].innerHTML = index;
                    this.tiles[index].painted_positions.push([x, y]);
                } else {
                    this.tile_indices[x][y].innerHTML = "X"
                }
            }
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

    clear_tile_positions(){
        this.tiles.forEach(tile => { tile.painted_positions = [] });
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
            state.tool_handler.change_tool("tile_painter")
        }

        state.tile_manager.tiles_wrapper.appendChild(this.canvas);

        //Array containing the positions at which this tile is painted
        this.painted_positions = [];
    }

    delete(){
        state.tile_manager.tiles_wrapper.removeChild(this.canvas);
    }
}
