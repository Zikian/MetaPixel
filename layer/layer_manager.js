class Layer_Manager{
    constructor(w, h){
        this.w = w;
        this.h = h;

        this.layers = []
        this.layers.push(new Layer(0, this.w, this.h));
        this.current_layer = this.layers[0]
        this.current_layer.set_active();

        document.getElementById("add-layer").onclick = function(){
            state.layer_manager.add_layer();
            state.history_manager.add_history("add-layer", [state.layer_manager.current_layer.index]);
        }
        
        document.getElementById("delete-layer").onclick = function(){
            state.layer_manager.delete_layer();
        }

        document.getElementById("move-layer-up").onclick = function(){
            var index = state.layer_manager.current_layer.index;
            if(index > 0){
                var layer_a = state.layer_manager.current_layer;
                var layer_b = state.layer_manager.layers[layer_a.index - 1];
                state.layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }
        
        document.getElementById("move-layer-down").onclick = function(){
            var index = state.layer_manager.current_layer.index;
            if(index < state.layer_manager.layers.length - 1){
                var layer_a = state.layer_manager.current_layer;
                var layer_b = state.layer_manager.layers[layer_a.index + 1];
                state.layer_manager.swap_layers(layer_a, layer_b);
                state.history_manager.add_history("swap-layers", [layer_a, layer_b]);
            }
        }
    }

    clip_current(){
        //Removes current clip by clearing draw canvas and render canvas, and makes new clip

        this.current_layer.clear();
        this.current_layer.redraw();

        //Use draw preview canvas as temp to store render canvas data
        state.main_canvas.draw_preview_ctx.drawImage(this.current_layer.render_canvas, 0, 0);
        this.current_layer.render_canvas.width = this.current_layer.render_canvas.width;
        //Redraw render canvas from preview canvas
        this.current_layer.render_ctx.drawImage(state.main_canvas.draw_preview_canvas, 0, 0);
        state.main_canvas.draw_preview_canvas.width = state.main_canvas.draw_preview_canvas.width;

        this.current_layer.clip();
    }

    add_layer(){
        var new_layer = new Layer(this.layers.length, this.w, this.h)
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
    }

    swap_layers(layer_a, layer_b){
        this.layers.swapItems(layer_a.index, layer_b.index);
        this.update_layer_indices();
        state.preview_canvas.redraw();
    }

    resize_layers(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].resize();
        }
    }

    clear_layers(){
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].clear();
        }
    }

    redraw_layers(){
        for(var i = this.layers.length - 1; i >= 0; i--){
            if (this.layers[i].visible){
                this.layers[i].redraw();
            }
        }
    }
}