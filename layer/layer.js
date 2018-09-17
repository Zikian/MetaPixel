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
        var this_instance = this
        this.wrapper.onclick = function(){ state.layer_manager.change_layer(this_instance.index); };
        
        this.name_elem = document.createElement("span");
        this.name_elem.className = "sidebar-window-span";
        this.name_elem.innerHTML = "Layer " + index;
        
        this.visibility_icon = document.createElement("i");
        this.visibility_icon.className = "fas fa-circle visibility-icon";
        this.visibility_icon.onclick = this.toggle_visibility(this, "button")

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
    }

    get_state() {
        return {
            data: this.render_canvas.toDataURL(),
            index: this.index,
            name: this.name_elem.innerHTML,
            visible: this.visible
        }
    }

    fill(x, y, new_color, old_color) {
        var data = this.render_ctx.getImageData(x * state.zoom, y * state.zoom, 1, 1).data;

        var is_old_color = compare_data(data, old_color);
        var is_new_color = compare_data(data, new_color);
        if(is_new_color) { return; }
        if(!is_old_color) { return; }

        this.render_ctx.fillRect(x * state.zoom, y * state.zoom, state.zoom, state.zoom);
        
        var selection_x = (state.selection.editor_x - canvas_x()) / state.zoom;
        var selection_y = (state.selection.editor_y - canvas_y()) / state.zoom;

        if(y + 1 < selection_y + state.selection.h) { this.fill(x, y + 1, new_color, old_color); }
        if(y - 1 >= selection_y) { this.fill(x, y - 1, new_color, old_color); }
        if(x + 1 < selection_x + state.selection.w) { this.fill(x + 1, y, new_color, old_color); }
        if(x - 1 >= selection_x){ this.fill(x - 1, y, new_color, old_color); }
    }

    clear_selection(){
        var x = state.selection.editor_x - canvas_x();
        var y = state.selection.editor_y - canvas_y();
        state.history_manager.prev_data = this.render_canvas.toDataURL();
        this.ctx.clearRect(x, y, state.selection.width(), state.selection.height());
        state.history_manager.new_data = this.render_canvas.toDataURL();
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
    }

    clear() {
        this.render_canvas.width = this.render_canvas.width;
    }

    toggle_visibility(owner, origin) {
        return function () {
            window.event.stopPropagation();
            if (owner.visible) {
                owner.visible = false;
                state.canvas_handler.redraw_layers();
                owner.visibility_icon.className = "far fa-circle visibility-icon";
            } else {
                owner.visible = true;
                state.canvas_handler.redraw_layers();
                owner.visibility_icon.className = "fas fa-circle visibility-icon";
            }
            state.preview_canvas.redraw();
            if (origin == "button") {
                state.history_manager.add_history("layer-visibility", [owner.index]);
            }
        }
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