class Canvas_Handler{
    constructor(){
        //Document size

        this.background_canvas = document.getElementById("background-canvas");
        this.background_canvas.width = canvas_w();
        this.background_canvas.height = canvas_w();
        this.background_ctx = this.background_canvas.getContext("2d");
        this.background_canvas.style.zIndex = "100";
        this.background_ctx.scale(state.zoom, state.zoom);
        
        this.middleground_canvas = document.getElementById("middleground-canvas");
        this.middleground_canvas.width = canvas_w();
        this.middleground_canvas.height = canvas_w();
        this.middleground_ctx = this.middleground_canvas.getContext("2d");
        this.middleground_canvas.style.zIndex = "101";
        
        this.foreground_canvas = document.getElementById("foreground-canvas");
        this.foreground_canvas.width = canvas_w();
        this.foreground_canvas.height = canvas_w();
        this.foreground_ctx = this.foreground_canvas.getContext("2d");
        this.foreground_canvas.style.zIndex = "102";
        this.foreground_ctx.scale(state.zoom, state.zoom);

        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70]
    }

    editor_w(){
        return state.editor.offsetWidth;
    }

    editor_h(){
        return state.editor.offsetHeight;
    }

    zoom(direction){
        state.prev_zoom = state.zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(state.zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            state.zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            state.zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }
        
        var old_zoom = state.prev_zoom;
        var old_x = state.pixel_pos[0];
        var old_y = state.pixel_pos[1];
        var new_zoom = state.zoom;
        
        var delta_x = old_x * old_zoom - old_x * new_zoom;
        var delta_y = old_y * old_zoom - old_y * new_zoom;

        this.move_canvas(delta_x, delta_y)
        
        state.mouse_indicator.style.width = state.zoom * state.brush_size + "px";
        state.mouse_indicator.style.height = state.zoom * state.brush_size + "px";
        state.mouse_indicator.style.left = state.pixel_pos[0] * state.zoom + "px";
        state.mouse_indicator.style.top = state.pixel_pos[1] * state.zoom + "px";

        state.tile_manager.resize_grid();
        state.tile_manager.reposition_indices();

        state.selection.resize();

        this.draw_middleground();
    }

    move_canvas(delta_x, delta_y){
        state.canvas_x += delta_x;
        state.canvas_y += delta_y;

        // Get intersection between canvas area rect and canvas rect
        var x1 = Math.max(canvas_x(), 0);
        var y1 = Math.max(canvas_y(), 0);
        var x2 = Math.min(canvas_x() + canvas_w(), this.editor_w());
        var y2 = Math.min(canvas_y() + canvas_w(), this.editor_h());
        var w = x2 - x1;
        var h = y2 - y1;

        state.canvas_wrapper.style.left = x1 + "px";
        state.canvas_wrapper.style.top = y1 + "px";
        state.canvas_wrapper.style.width = w + "px";
        state.canvas_wrapper.style.height = h + "px";

        this.background_canvas.width = w;
        this.background_canvas.height = h;
        this.middleground_canvas.width = w;
        this.middleground_canvas.height = h;
        this.foreground_canvas.width = w;
        this.foreground_canvas.height = h;

        this.background_ctx.scale(state.zoom, state.zoom);
        this.foreground_ctx.scale(state.zoom, state.zoom);

        state.canvas_wrapper.style.backgroundPositionX = canvas_x() - state.canvas_wrapper.offsetLeft + "px";
        state.canvas_wrapper.style.backgroundPositionY = canvas_y() - state.canvas_wrapper.offsetTop + "px";

        state.selection.move(delta_x, delta_y)
        state.overlay_canvas.move();

        this.draw_middleground();
    }
    
    draw_background(){
        this.background_ctx.clearRect(0, 0, this.background_canvas.width, this.background_canvas.height);
        this.background_ctx.imageSmoothingEnabled = false;
        var background_layers = state.layer_manager.layers.slice(state.layer_manager.current_layer.index + 1, state.layer_manager.layers.length);
        background_layers.reverse() // Lower layers are have higher indexes
        background_layers.forEach(layer => {
            if(layer.visible){
                this.background_ctx.globalAlpha = layer.opacity;
                this.background_ctx.drawImage(layer.render_canvas, (canvas_x() - state.canvas_wrapper.offsetLeft) / state.zoom, (canvas_y() - state.canvas_wrapper.offsetTop) / state.zoom);
            }
        });
        this.background_ctx.globalAlpha = 1;
    }
    
    draw_middleground(){
        var layer = state.layer_manager.current_layer;
        this.middleground_ctx.clearRect(0, 0, this.middleground_canvas.width, this.middleground_canvas.height);
        if(!layer.visible) { return; }
        this.middleground_ctx.imageSmoothingEnabled = false;
        this.middleground_ctx.globalAlpha = layer.opacity;
        this.middleground_ctx.scale(state.zoom, state.zoom)
        this.middleground_ctx.drawImage(layer.render_canvas, (canvas_x() - state.canvas_wrapper.offsetLeft) / state.zoom, (canvas_y() - state.canvas_wrapper.offsetTop) / state.zoom);
        this.middleground_ctx.scale(1 / state.zoom, 1 / state.zoom)
        this.middleground_ctx.globalAlpha = 1
    }

    draw_foreground(){
        this.foreground_ctx.clearRect(0, 0, this.foreground_canvas.width, this.foreground_canvas.height);
        this.foreground_ctx.imageSmoothingEnabled = false;
        var foreground_layers = state.layer_manager.layers.slice(0, state.layer_manager.current_layer.index);
        foreground_layers.reverse() // Lower layers are have higher indexes
        foreground_layers.forEach(layer => {
            if(layer.visible){
                this.foreground_ctx.globalAlpha = layer.opacity;
                this.foreground_ctx.drawImage(layer.render_canvas, (canvas_x() - state.canvas_wrapper.offsetLeft) / state.zoom, (canvas_y() - state.canvas_wrapper.offsetTop) / state.zoom);
            }
        });
    }

    redraw_layers(){
        this.draw_background();
        this.draw_middleground();
        this.draw_foreground();
    }
}