class Tileset_Settings{
    constructor(){
        this.wrapper = document.getElementById("tileset-settings");

        this.width_input = document.getElementById("tileset-width-setting");
        this.width_input.oninput = function(){ 
            var leading_zero = /^0[0-9].*$/;
            if(leading_zero.test(this.value)){
              this.value = parseInt(this.value, 10);
            }
        }

        this.header = document.getElementById("tileset-settings-header");
        this.header.onmousedown = set_active_element;
        this.header.mousedrag_actions  = function(){ drag_element(state.tileset_settings.wrapper, state.delta_mouse); }

        document.getElementById("tileset-settings-ok").onclick = function(){
            state.tileset_settings.submit_settings();
        }

        document.getElementById("tileset-settings-cancel").onclick = function(){
            state.tileset_settings.cancel_settings();
        }
        
        document.getElementById("tileset-settings-cross").onclick = function(){
            state.tileset_settings.cancel_settings();
        }

        document.getElementById("tileset-settings-button").onclick = function(){
            state.tileset_settings.wrapper.style.display = "block";
            state.tileset_settings.width_input.value = state.tile_manager.tileset_w;
            state.tileset_settings.update_window_position();
        }
    }

    update_window_position(){
        this.wrapper.style.top = state.tile_manager.tiles_body.getBoundingClientRect().y + "px";
        this.wrapper.style.left = state.tile_manager.tiles_body.getBoundingClientRect().x - 220 + "px";
    }
    
    submit_settings(){
        var prev_tileset_w = state.tile_manager.tileset_w;
        if(this.width_input.value.length == 0 || this.width_input.value <= 0){
            this.width_input.value = 1;
        }
        state.tile_manager.tileset_w = this.width_input.value;
        state.tile_manager.tiles.forEach(tile => {
            tile.update_tileset_position();
        });
        state.tileset_settings.wrapper.style.display = "none";
        if(prev_tileset_w != state.tile_manager.tileset_w){
            state.history_manager.add_history("tileset-settings", [prev_tileset_w]);
        }
    }
    
    cancel_settings(){
        state.tileset_settings.wrapper.style.display = "none";
    }
}