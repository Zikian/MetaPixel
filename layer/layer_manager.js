class Layer_Manager{
    constructor(){
        this.layers = []
        this.layers.push(new Layer(0));
        state.current_layer = this.layers[0]
        state.current_layer.set_active();

        this.layers_body = document.getElementById("layers-body");

        var layer_manager = this;
        document.getElementById("add-layer").onclick = function(){
            layer_manager.add_layer();
            state.history_manager.add_history("add-layer", [state.current_layer.index]);
        }
        
        document.getElementById("delete-layer").onclick = function(){
            state.history_manager.add_history("delete-layer", [state.current_layer.get_state()]);
            layer_manager.delete_layer(state.current_layer.index);
        }

        document.getElementById("move-layer-up").onclick = function(){
            var index = state.current_layer.index;
            if(index > 0){
                var layer_a = state.current_layer;
                var layer_b = layer_manager.layers[layer_a.index - 1];
                layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }
        
        document.getElementById("move-layer-down").onclick = function(){
            var index = state.current_layer.index;
            if(index < layer_manager.layers.length - 1){
                var layer_a = state.current_layer;
                var layer_b = layer_manager.layers[layer_a.index + 1];
                layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }

        document.getElementById("merge-layer-down").onclick = function(){
            var index = state.current_layer.index;
            if(index == state.layer_manager.layers.length - 1) { return; } 

            var top_layer_state = state.current_layer.get_state();
            var bottom_layer_data = state.layer_manager.layers[index + 1].get_data();

            state.layer_manager.merge_layer_down(index);
            
            state.history_manager.add_history("merge-layers", [bottom_layer_data, top_layer_state]);
        }

        //Attach function to resize window to resizer
        document.getElementById("layers-resizer").onmousedown = set_active_element;
        document.getElementById("layers-resizer").mousedrag_actions = resize_sidebar_window(this.layers_body);
    }

    add_layer(){
        var new_layer = new Layer(this.layers.length)
        this.layers.splice(state.current_layer.index, 0, new_layer);
        this.update_layer_indices();
        this.change_layer(new_layer.index);
    }

    delete_layer(index){
        if (this.layers.length == 1) { return; }

        this.layers.splice(index, 1);
        state.current_layer.delete();
        this.update_layer_indices(state.current_layer);
        this.change_layer(0)

        state.preview_canvas.render();
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.frame_canvas.render();
    }

    update_layer_indices(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].index = i;
            this.layers[i].reposition();
        }
    }

    change_layer(index){
        state.current_layer.set_inactive();
        state.current_layer = this.layers[index];
        state.tile_manager.update_tile_mappings(state.current_layer);
        state.current_layer.set_active();
        state.canvas_handler.redraw_layers();
    }

    swap_layers(layer_a, layer_b){
        this.layers.swapItems(layer_a.index, layer_b.index);
        this.update_layer_indices();
        state.preview_canvas.render();
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.frame_canvas.render();
    }

    merge_layer_down(index){
        var top_layer = this.layers[index];
        var bottom_layer = this.layers[index + 1];
        bottom_layer.render_ctx.drawImage(top_layer.render_canvas, 0, 0);

        this.delete_layer(index);
        this.change_layer(index);
    }

    clear_layers(){
        this.layers.forEach(layer => {
            layer.clear();
        });
    }
}