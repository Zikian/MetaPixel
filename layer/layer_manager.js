class Layer_Manager{
    constructor(w, h){
        this.layers = []
        this.layers.push(new Layer(0));
        this.current_layer = this.layers[0]
        this.current_layer.set_active();

        var layer_manager = this;
        document.getElementById("add-layer").onclick = function(){
            layer_manager.add_layer();
            state.history_manager.add_history("add-layer", [layer_manager.current_layer.index]);
        }
        
        document.getElementById("delete-layer").onclick = function(){
            layer_manager.delete_layer();
        }

        document.getElementById("move-layer-up").onclick = function(){
            var index = layer_manager.current_layer.index;
            if(index > 0){
                var layer_a = layer_manager.current_layer;
                var layer_b = layer_manager.layers[layer_a.index - 1];
                layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }
        
        document.getElementById("move-layer-down").onclick = function(){
            var index = layer_manager.current_layer.index;
            if(index < layer_manager.layers.length - 1){
                var layer_a = layer_manager.current_layer;
                var layer_b = layer_manager.layers[layer_a.index + 1];
                layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }

        //Attach function to resize window to resizer
        document.getElementById("layers-resizer").onmousedown = set_active_element;
        document.getElementById("layers-resizer").active_func = resize_sidebar_window(document.getElementById("layers-body"));
    }

    add_layer(){
        var new_layer = new Layer(this.layers.length)
        this.layers.splice(this.current_layer.index, 0, new_layer);
        this.update_layer_indices();
        this.change_layer(new_layer.index);
    }

    delete_layer(){
        if (this.layers.length == 1) { return; }

        var layer_state = this.current_layer.get_state();
        state.history_manager.add_history("delete-layer", [layer_state]);

        this.layers.splice(this.current_layer.index, 1);
        this.current_layer.delete();
        this.update_layer_indices();
        this.change_layer(0)

        state.preview_canvas.redraw();
    }

    update_layer_indices(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].index = i;
            this.layers[i].reposition();
        }
    }

    change_layer(index){
        this.current_layer.set_inactive();
        this.current_layer = this.layers[index];
        this.current_layer.set_active();
        state.canvas_handler.redraw_layers();
    }

    swap_layers(layer_a, layer_b){
        this.layers.swapItems(layer_a.index, layer_b.index);
        this.update_layer_indices();
        state.preview_canvas.redraw();
        state.canvas_handler.redraw_layers();
    }

    clear_layers(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].clear();
        }
    }
}