class Layer {
    constructor(index) {
        this.visible = true;
        this.index = index;
        this.opacity = 1;
        this.prev_pixel = {
            color: null,
            x: null,
            y: null
        };
        
        this.render_canvas = document.createElement("canvas");
        this.render_canvas.width = state.doc_w;
        this.render_canvas.height = state.doc_h;
        this.render_ctx = this.render_canvas.getContext("2d");
        
        this.wrapper = document.createElement("div");
        this.wrapper.className = "layer";
        this.wrapper.style.top = 30 * this.index + "px";
        var owner = this;
        this.wrapper.onclick = function(){ state.layer_manager.change_layer(owner.index); };
        
        this.name_elem = document.createElement("span");
        this.name_elem.className = "sidebar-window-span";
        this.name_elem.innerHTML = "Layer " + index;
        
        this.visibility_icon = document.createElement("i");
        this.visibility_icon.className = "fas fa-circle visibility-icon";
        this.visibility_icon.onclick = function(){
            owner.toggle_visibility();
            state.history_manager.add_history("layer-visibility", [owner.index]);
        }

        this.settings_button = document.createElement("div");
        this.settings_button.className = "button sidebar-window-button layer-settings-button"
        this.settings_button.onclick = function(){ state.layer_settings.open(owner) };
        var settings_icon = document.createElement("i");
        settings_icon.className = "fas fa-cog sidebar-window-button-icon";
        this.settings_button.appendChild(settings_icon);

        this.wrapper.appendChild(this.name_elem);
        this.wrapper.appendChild(this.visibility_icon);
        this.wrapper.appendChild(this.settings_button);
        document.getElementById("layers-body").appendChild(this.wrapper);

        //array containing tile mappings for this layer
        this.tilemap = new Array(state.tiles_x * state.tiles_y);
    }

    get_painted_tiles(rect){
        var indices = [];
        var positions = [];
        var x = rect.start_x;
        var y = rect.start_y;
        for(var x = rect.start_x; x <= rect.end_x; x++){
            for(var y = rect.start_y; y <= rect.end_y; y++){
                var index = this.tilemap[x + y * state.tiles_x];
                if(index == null){ continue; }
                indices.push(index);
                positions.push([x, y]);
            }
        }
        return {
            indices: indices,
            positions: positions
        }
    }

    get_state() {
        return {
            data: this.get_data(),
            index: this.index,
            name: this.name_elem.innerHTML,
            visible: this.visible
        }
    }

    get_data(){
        return this.render_ctx.getImageData(0, 0, state.doc_w, state.doc_h)
    }

    draw_data(data){
        this.render_ctx.putImageData(data, 0, 0);
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
        state.frame_canvas.render();
    }

    update_settings(settings){
        this.opacity = settings.opacity;
        this.name_elem.innerHTML = settings.name;
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
        state.frame_canvas.render();
    }

    clear() {
        this.render_canvas.width = this.render_canvas.width;
    }

    toggle_visibility() {
        event.stopPropagation();
        if (this.visible) {
            this.visibility_icon.className = "far fa-circle visibility-icon";
        } else {
            this.visibility_icon.className = "fas fa-circle visibility-icon";
        }
        this.visible = !this.visible;
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
        state.frame_canvas.render();
    }

    reposition() {
        this.wrapper.style.top = 27 * this.index + "px";
    }

    set_active() {
        this.wrapper.style.backgroundColor = "rgb(38, 38, 43)";
        this.settings_button.style.backgroundColor = "rgb(38, 38, 43)";
    }

    set_inactive(){
        this.wrapper.style.backgroundColor = "rgb(59, 59, 65)";
        this.settings_button.style.backgroundColor = "rgb(59, 59, 65)";
    }

    delete() {
        document.getElementById("layers-body").removeChild(this.wrapper);
    }
}