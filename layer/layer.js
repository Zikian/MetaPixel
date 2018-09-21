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
        var this_instance = this;
        this.wrapper.onclick = function(){ state.layer_manager.change_layer(this_instance.index); };
        
        this.name_elem = document.createElement("span");
        this.name_elem.className = "sidebar-window-span";
        this.name_elem.innerHTML = "Layer " + index;
        
        this.visibility_icon = document.createElement("i");
        this.visibility_icon.className = "fas fa-circle visibility-icon";
        this.visibility_icon.onclick = function(){
            this_instance.toggle_visibility();
            state.history_manager.add_history("layer-visibility", [owner.index]);
        }

        this.settings_button = document.createElement("div");
        this.settings_button.className = "button sidebar-window-button layer-settings-button"
        this.settings_button.onclick = function(){ state.layer_settings.open(this_instance) };
        var settings_icon = document.createElement("i");
        settings_icon.className = "fas fa-cog sidebar-window-button-icon";
        this.settings_button.appendChild(settings_icon);

        this.wrapper.appendChild(this.name_elem);
        this.wrapper.appendChild(this.visibility_icon);
        this.wrapper.appendChild(this.settings_button);
        document.getElementById("layers-body").appendChild(this.wrapper);

        //Each element of painted tiles is an array containing
        //the positions of the tiles painted onto the document
        //corresponding to the index of the array in painted tiles.
        this.painted_tiles = [];
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
        return this.render_canvas.toDataURL();
    }

    draw_data(data){
        this.clear();
        var img = new Image();
        var this_instance = this;
        img.onload = function(){
            this_instance.render_ctx.drawImage(this, 0, 0);
            state.canvas_handler.redraw_layers();
            state.canvas_handler.render_draw_canvas();
            state.preview_canvas.redraw();
        }
        img.src = data;
    }

    update_settings(settings){
        this.opacity = settings.opacity;
        this.name_elem.innerHTML = settings.name;
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
    }

    clear_selection(){
        var x = state.selection.editor_x - canvas_x();
        var y = state.selection.editor_y - canvas_y();
        state.history_manager.prev_data = this.get_data();
        this.render_ctx.clearRect(x / state.zoom, y / state.zoom, state.selection.w, state.selection.h);
        state.history_manager.new_data = this.get_data();
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
        state.canvas_handler.redraw_layers()
        state.canvas_handler.render_draw_canvas();
    }

    clear() {
        this.render_canvas.width = this.render_canvas.width;
    }

    toggle_visibility() {
        event.stopPropagation();
        if (this.visible) {
            this.visible = false;
            this.visibility_icon.className = "far fa-circle visibility-icon";
        } else {
            this.visible = true;
            this.visibility_icon.className = "fas fa-circle visibility-icon";
        }
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_draw_canvas();
        state.preview_canvas.redraw();
    }

    reposition() {
        this.wrapper.style.top = 30 * this.index + "px";
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