class Tile_Manager{
    constructor(tile_w, tile_h){
        this.tile_w = tile_w;
        this.tile_h = tile_h;
        this.tiles_x = state.main_canvas.w / this.tile_w;
        this.tiles_y = state.main_canvas.h / this.tile_h;
        
        this.tiles = [];
        this.current_tile = null;

        this.tiles_wrapper = document.getElementById("tiles-wrapper");

        this.resizer = document.getElementById("tiles-resizer");
        this.resizer.onmousedown = set_active_element;
        this.body = document.getElementById("tiles-body")
        this.resizer.active_func = resize_sidebar_window(this);

        this.grid = document.getElementById("tile-grid");
        this.resize_grid();

        this.add_tile_button = document.getElementById("add-tile");
        this.add_tile_button.onclick = this.add_tile(this);
        this.add_tile_button.click();
        
        this.tile_indices = [];
        for(var x = 0; x < this.tiles_x; x++){
            for(var y = 0; y < this.tiles_y; y++){
                var index_elem = document.createElement("span");
                index_elem.innerHTML = "0";
                index_elem.className = "tile-index";
                index_elem.x = x;
                index_elem.y = y;
                index_elem.index = null;
                state.canvas_wrapper.appendChild(index_elem);
                this.tile_indices.push(index_elem);
            }
        }

        this.reposition_indices()
    }

    get_hovered_tile(){
        return {
            x: Math.floor(state.pixel_pos[0] / this.tile_w),
            y: Math.floor(state.pixel_pos[1] / this.tile_h)
        }
    }

    reposition_indices(){
        this.tile_indices.forEach(index_elem => {
            index_elem.style.left = index_elem.x * this.tile_w * state.zoom + 4 + "px";
            index_elem.style.top = index_elem.y * this.tile_h * state.zoom + "px";
        });
    }

    add_tile(owner){
        return function(){
            var new_tile = document.createElement("div");
            new_tile.className = "tile";
            new_tile.index = owner.tiles.length;
            owner.tiles.push(new_tile);
            new_tile.onclick = function(){
                this.style.outline = "2px solid black";
                owner.current_tile = this;
            }
            owner.tiles_wrapper.appendChild(new_tile);
        }
    }

    resize_grid(){
        this.grid.style.backgroundSize = this.tile_w * state.zoom + "px " + this.tile_h * state.zoom + "px";
    }
}