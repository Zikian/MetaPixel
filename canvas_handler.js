class Canvas_Handler{
    constructor(){
        this.zoom_stages = [0.125, 0.250, 0.333, 0.5, 1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70, 200];
        var zoom = Math.floor(Math.min(state.editor.offsetWidth / state.doc_w, state.editor.offsetHeight / state.doc_h));
        for(var i = 0; i < this.zoom_stages.length - 1; i++){
            if(this.zoom_stages[i] <= zoom && zoom <= this.zoom_stages[i+1]){
                state.zoom = this.zoom_stages[i];
            }
        }
        if(zoom < this.zoom_stages[0]){ state.zoom = this.zoom_stages[0]; }
        state.prev_zoom = state.zoom;

        this.background_canvas = document.createElement("canvas");
        this.background_canvas.width = state.doc_w;
        this.background_canvas.height = state.doc_h;
        this.background_ctx = this.background_canvas.getContext("2d");
        
        this.draw_canvas = document.getElementById("draw-canvas");
        this.draw_canvas.width = canvas_w();
        this.draw_canvas.height = canvas_h();
        this.draw_ctx = this.draw_canvas.getContext("2d");
        this.draw_ctx.scale(state.zoom, state.zoom);
        
        this.foreground_canvas = document.createElement("canvas");
        this.foreground_canvas.width = state.doc_w;
        this.foreground_canvas.height = state.doc_h;
        this.foreground_ctx = this.foreground_canvas.getContext("2d");

        var canvas_left = (state.editor.offsetWidth - canvas_w())/2
        var canvas_top = (state.editor.offsetHeight - canvas_h())/2
        
        this.draw_canvas.style.left = canvas_left + "px";
        this.draw_canvas.style.top = canvas_top + "px";
        state.canvas_x = canvas_left;
        state.canvas_y = canvas_top;
    }

    zoom(direction){
        var prev_zoom = state.zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(state.zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            state.zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            state.zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }
        
        state.canvas_x += state.pixel_pos[0] * (prev_zoom - state.zoom);
        state.canvas_y += state.pixel_pos[1] * (prev_zoom - state.zoom);
        
        correct_canvas_position();
        update_mouse_indicator();
        state.preview_canvas.update_visible_rect();
        state.animator.resize_anim_bounds();
        state.tile_manager.resize_tile_placer_rect();
        
        if(state.tile_w * state.zoom < 32 || state.tile_h * state.zoom < 32){
            state.tile_manager.hide_indices();
        } else {
            state.tile_manager.show_indices();
        }

        state.zoom_info.innerHTML = `Zoom: ${state.zoom}x`;
    }
    
    move_canvas(delta_x, delta_y){
        state.canvas_x += delta_x;
        state.canvas_y += delta_y;
        
        // Get intersection between canvas area rect and canvas rect
        var x1 = Math.max(canvas_x(), 0);
        var y1 = Math.max(canvas_y(), 0);
        var w = Math.min(canvas_x() + canvas_w(), state.editor.offsetWidth) - x1;
        var h = Math.min(canvas_y() + canvas_h(), state.editor.offsetHeight) - y1;
        
        this.draw_canvas.style.left = x1 + "px";
        this.draw_canvas.style.top = y1 + "px";
        this.draw_canvas.width = w;
        this.draw_canvas.height = h;
        this.draw_ctx.scale(state.zoom, state.zoom);
        
        state.hidden_x = -Math.min(state.canvas_x, 0);
        state.hidden_y = -Math.min(state.canvas_y, 0);
        state.pixel_hidden_x = state.hidden_x / state.zoom;
        state.pixel_hidden_y = state.hidden_y / state.zoom;
        
        state.selection.update();
        state.preview_canvas.update_visible_rect();
        state.animator.update_frame_indicator();
        state.tile_manager.reposition_indices();
        this.render_drawing();
        state.animator.reposition_anim_bounds(state.current_anim);
    }
    
    redraw_background(){
        this.background_canvas.width = this.background_canvas.width;
        var background_layers = state.layer_manager.layers.slice(state.current_layer.index, state.layer_manager.layers.length);
        background_layers.reverse().forEach(layer => {
            if(layer.visible){
                this.background_ctx.globalAlpha = layer.opacity;
                this.background_ctx.drawImage(layer.render_canvas, 0, 0);
            }
        });
    }

    redraw_foreground(){
        this.foreground_canvas.width = this.foreground_canvas.width;
        var foreground_layers = state.layer_manager.layers.slice(0, state.current_layer.index);
        foreground_layers.reverse().forEach(layer => {
            if(layer.visible){
                this.foreground_ctx.globalAlpha = layer.opacity;
                this.foreground_ctx.drawImage(layer.render_canvas, 0, 0);
            }
        });
    }
    
    redraw_layers(){
        this.redraw_background();
        this.redraw_foreground();
    }

    render_drawing(){
        this.draw_ctx.clearRect(0, 0, state.doc_w, state.doc_h);
        this.draw_ctx.imageSmoothingEnabled = false;
        this.draw_ctx.drawImage(this.background_canvas, -state.pixel_hidden_x, -state.pixel_hidden_y);
        this.draw_ctx.drawImage(state.selection.paste_canvas, state.selection.x, state.selection.y);
        this.draw_ctx.drawImage(this.foreground_canvas, -state.pixel_hidden_x, -state.pixel_hidden_y);
        this.render_tile_grid();
    }

    render_background(){
        this.draw_ctx.clearRect(0, 0, state.doc_w, state.doc_h)
        this.draw_ctx.imageSmoothingEnabled = false;
        this.draw_ctx.drawImage(this.background_canvas, -state.pixel_hidden_x, -state.pixel_hidden_y);

        state.frame_canvas.clear();
        state.frame_canvas.render_background();
    }
    
    render_foreground(){
        this.draw_ctx.imageSmoothingEnabled = false;    
        this.draw_ctx.drawImage(this.foreground_canvas, -state.pixel_hidden_x, -state.pixel_hidden_y);
        this.render_tile_grid();

        state.frame_canvas.render_foreground();
    }

    render_tile_grid(){
        if(state.tile_w * state.zoom < 32 || state.tile_h * state.zoom < 32) { return; }

        this.draw_ctx.imageSmoothingEnabled = false;
        this.draw_ctx.beginPath()
        this.draw_ctx.strokeStyle = "rgb(160, 160, 160)"
        this.draw_ctx.lineWidth = 1 / state.zoom;
        var x = state.tiles_x;
        var y = state.tiles_y;
        var line_offset = 0.5 / state.zoom
        while(x--){
            this.draw_ctx.moveTo(x * state.tile_w - state.pixel_hidden_x + line_offset, 0)
            this.draw_ctx.lineTo(x * state.tile_w - state.pixel_hidden_x + line_offset, canvas_h())
        }
        while(y--){
            this.draw_ctx.moveTo(0, y * state.tile_h - state.pixel_hidden_y + line_offset);
            this.draw_ctx.lineTo(canvas_w(), y * state.tile_h - state.pixel_hidden_y + line_offset);
        }
        this.draw_ctx.stroke();
    }
}                 
