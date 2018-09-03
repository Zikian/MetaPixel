class Layer_Manager{
    constructor(w, h){
        this.w = w;
        this.h = h;

        this.layers = []
        this.layers.push(new Layer(0, this.w, this.h));
        this.current_layer = this.layers[0]
        this.current_layer.set_active();
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