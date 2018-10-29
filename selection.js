class Selection{
    constructor(){
        this.x = 0;
        this.y = 0;
        this.w = state.doc_w;
        this.h = state.doc_h;

        this.exists = false;
        this.forming = false;
        this.being_dragged = false;

        this.frame_selection_rect = document.getElementById("frame-selection-rect");
        this.selection_rect = document.getElementById("selection-rect");

        this.copy_canvas = document.createElement("canvas");
        this.copy_ctx = this.copy_canvas.getContext("2d");

        this.clipboard_canvas = document.createElement("canvas");
        this.clipboard_ctx = this.clipboard_canvas.getContext("2d");

        this.paste_canvas = document.createElement("canvas");
        this.paste_ctx = this.paste_canvas.getContext("2d");

        this.prev_state;

        this.resizers = document.getElementsByClassName("selection-resizer");

        this.clamp_x;
        this.clamp_y;
        this.resize_x;
        this.resize_y;
        this.flip_x = false;
        this.flip_y = false;

        this.resize_actions = {
            0: "top-left", 
            1: "top-middle", 
            2: "top-right", 
            3: "middle-left",
            4: "middle-right",
            5: "bottom-left",
            6: "bottom-middle",
            7: "bottom-right",
        }

        for(var i = 0; i < 16; i++){
            this.resizers[i].mousedrag_actions = function(){
                state.selection.resize();
            }
        }

        for(var i = 0; i < 8; i++){
            this.resizers[i].resize_action = this.resize_actions[i];
            this.resizers[i].onmousedown = function(){
                pauseEvent(event);
                state.active_element = this;
                state.selection.update_resize_state(this.resize_action);
            }
        }
        
        for(var i = 8; i < 16; i++){
            this.resizers[i].resize_action = this.resize_actions[i - 8]
            this.resizers[i].onmousedown = function(){
                pauseEvent(event);
                state.active_element = this;
                pixel_pos_from_frame();
                state.selection.update_resize_state(this.resize_action);
            }
        }

        this.frame_selection_rect.mousedrag_actions = state.tool_handler.tools["select"].mousedrag_actions;
        this.frame_selection_rect.onmousedown = function(){
            if(state.tool_handler.current_tool.id == "select"){
                pauseEvent(event);
                pixel_pos_from_frame();
                state.active_element = this;
                state.tool_handler.current_tool.mouseleft_actions();
            }
        }
    }

    change_resize_state(clamp_x, clamp_y, resize_x, resize_y){
        this.clamp_x = clamp_x;
        this.clamp_y = clamp_y;
        this.resize_x = resize_x;
        this.resize_y = resize_y;
    }

    update_resize_state(direction){
        switch(direction){
            case "top-left":
                this.change_resize_state(false, false, true, true);
                break;
            case "top-middle":
                this.change_resize_state(true, false, false, true);
                break;
            case "top-right":
                this.change_resize_state(true, false, true, true);
                break;
            case "middle-left":
                this.change_resize_state(false, true, true, false);
                break;
            case "middle-right":
                this.change_resize_state(true, true, true, false);
                break;
            case "bottom-left":
                this.change_resize_state(false, true, true, true);
                break;
            case "bottom-middle":
                this.change_resize_state(true, true, false, true);
                break;
            case "bottom-right":
                this.change_resize_state(true, true, true, true);
                break;
        }
    }

    resize(){
        var dx = state.delta_pixel_pos[0];
        var dy = state.delta_pixel_pos[1];

        if(this.resize_x){
            var new_w = this.w + dx * (this.clamp_x - !this.clamp_x);
            if(new_w < 0){
                this.clamp_x = !this.clamp_x;    
                this.flip_x = !this.flip_x;
                var prev_w = this.w;
                this.w = dx < 0 ? this.x - state.pixel_pos[0] : dx - this.w;
                this.x = dx < 0 ? state.pixel_pos[0] : this.x + prev_w;
            } else {
                this.w = new_w;
                this.x += dx * !this.clamp_x;
            }
        }

        if(this.resize_y){
            var new_h = this.h + dy * (this.clamp_y - !this.clamp_y);
            if(new_h < 0){
                this.clamp_y = !this.clamp_y;
                this.flip_y = !this.flip_y;
                var prev_h = this.h;
                this.h = dy < 0 ? this.y - state.pixel_pos[1] : dy - this.h;
                this.y = dy < 0 ? state.pixel_pos[1] : this.y + prev_h;
            } else {
                this.y += dy * !this.clamp_y;
                this.h = new_h;
            }
        }

        this.form_selection(this.x, this.y, this.w, this.h);

        this.flip_paste_canvas(this.flip_x, this.flip_y);

        state.canvas_handler.render_drawing();
        state.preview_canvas.redraw();
    }

    flip_paste_canvas(flip_x, flip_y){
        if(this.w == 0 || this.h == 0) { return; }
        this.paste_canvas.width = this.w;
        this.paste_canvas.height = this.h;

        this.paste_ctx.translate(flip_x * this.w, flip_y * this.h)
        this.paste_ctx.scale(flip_x?-1:1, flip_y?-1:1);
        
        this.paste_ctx.imageSmoothingEnabled = false;
        this.paste_ctx.drawImage(this.copy_canvas, 0, 0, this.w, this.h);
    }

    draw_paste_canvas(){
        if(this.w == 0 || this.h == 0) { return; }
        this.paste_canvas.width = this.w;      
        this.paste_canvas.height = this.h;
        this.paste_ctx.imageSmoothingEnabled = false;
        this.paste_ctx.drawImage(this.copy_canvas, 0, 0, this.w, this.h);
    }

    get_state(){
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            exists: this.exists
        }
    }
    
    load_from_state(new_state){
        if(!new_state.exists){ this.clear(); return; }
        this.form_selection(new_state.x, new_state.y, new_state.w, new_state.h);
    }

    save(){
        this.prev_state = this.get_state();
    }

    restore(){
        this.load_from_state(this.prev_state);
    }

    draw(){
        if(state.input.shift){
            state.selection_end = rect_to_square(...state.selection_start, ...state.selection_end);
        }

        var x = Math.min(state.selection_start[0], state.selection_end[0]);
        var y = Math.min(state.selection_start[1], state.selection_end[1]);
        var w = Math.max(state.selection_start[0], state.selection_end[0]) - x + 1;
        var h = Math.max(state.selection_start[1], state.selection_end[1]) - y + 1;
        this.form_selection(x, y, w, h);
    }
    
    form_selection(x, y, w, h){
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.exists = true;

        this.selection_rect.style.left = x * state.zoom + canvas_x() + "px";
        this.selection_rect.style.top = y * state.zoom + canvas_y() + "px"
        this.selection_rect.style.width = w * state.zoom + "px";
        this.selection_rect.style.height = h * state.zoom + "px";
        this.selection_rect.style.display = "block";

        this.update_frame_selection();
    }

    get_intersection(){
        if(!this.exists) { this.clear(); return }
        var x = Math.max(this.x, 0);
        var y = Math.max(this.y, 0);
        var w = Math.min(this.x + this.w, state.doc_w) - x;
        var h = Math.min(this.y + this.h, state.doc_h) - y;
        (w <= 0 || h <= 0) ? this.clear() : this.form_selection(x, y, w, h);
    }

    clear(){
        this.x = 0;
        this.y = 0;
        this.w = state.doc_w;
        this.h = state.doc_h;
        this.selection_rect.style.left = 0;
        this.selection_rect.style.top = 0;
        this.exists = false;
        this.selection_rect.style.display = "none";
        this.update_frame_selection();
    }

    contains_mouse(){
        return (state.pixel_pos[0] >= this.x && 
                state.pixel_pos[1] >= this.y && 
                state.pixel_pos[0] < this.x + this.w && 
                state.pixel_pos[1] < this.y + this.h)
    }

    update(){
        if(!this.exists) { this.clear(); return; }
        this.form_selection(this.x, this.y, this.w, this.h);   
    }

    drag(){
        this.x += state.delta_pixel_pos[0];
        this.y += state.delta_pixel_pos[1];
        this.selection_rect.style.left = this.x * state.zoom + canvas_x() + "px";
        this.selection_rect.style.top = this.y * state.zoom + canvas_y() + "px";
        this.update_frame_selection();
    }

    flip(direction){
        if(!this.exists || this.transform){ return; }

        state.history_manager.prev_data = state.current_layer.get_data();
        state.history_manager.prev_tile_data = state.tile_manager.get_tile_data();

        this.paste_canvas.width = this.w;
        this.paste_canvas.height = this.h;

        if(direction == "horizontal"){
            this.paste_ctx.translate(this.w, 0);
            this.paste_ctx.scale(-1, 1);
        } else {
            this.paste_ctx.translate(0, this.h); 
            this.paste_ctx.scale(1, -1);
        }

        this.paste_ctx.drawImage(state.current_layer.render_canvas, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
        clear_selection_contents();
        this.paste();
        this.paste_canvas.width = this.paste_canvas.width;

        state.history_manager.add_history("pen-stroke");
    }

    detach(){
        this.transform = true;

        this.copy_canvas.width = this.w;
        this.copy_canvas.height = this.h;
        this.copy_ctx.drawImage(state.current_layer.render_canvas, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);

        this.draw_paste_canvas();

        clear_selection_contents();
        state.canvas_handler.render_drawing();
        this.toggle_resizers();
    }
    
    commit(){
        this.transform = false;
        this.flip_x = false;
        this.flip_y = false;

        this.toggle_resizers();

        this.paste();

        this.copy_canvas.width = this.copy_canvas.width;
        this.paste_canvas.width = this.paste_canvas.width;
        
        this.get_intersection();
    }

    copy(){
        this.clipboard_canvas.width = this.w;
        this.clipboard_canvas.height = this.h;
        this.clipboard_ctx.drawImage(state.current_layer.render_canvas, this.x - state.pixel_hidden_x, this.y - state.pixel_hidden_y, this.w, this.h, 0, 0, this.w, this.h);
    }

    load_clipboard(){
        if(this.clipboard_canvas.width == 0) { return; }
        
        this.transform = true;
        this.toggle_resizers();
        
        this.form_selection(0, 0, this.clipboard_canvas.width, this.clipboard_canvas.height);

        this.copy_canvas.width = this.w;
        this.copy_canvas.height = this.h;
        this.copy_ctx.imageSmoothingEnabled = false;
        this.copy_ctx.drawImage(this.clipboard_canvas, 0, 0);
        
        this.draw_paste_canvas();

        state.canvas_handler.render_drawing();
        state.preview_canvas.redraw();
    }

    paste(){
        var containing_tiles = state.tile_manager.get_containing_tiles(this.x, this.y, this.w, this.h);
        var target_tiles = state.current_layer.get_painted_tiles(containing_tiles);

        for(var i = 0; i < target_tiles.indices.length; i++){
            //Tile that is being drawn on
            var tile = state.tile_manager.tiles[target_tiles.indices[i]];

            // Position of painted tile that is being drawn on
            var target_position = target_tiles.positions[i];
            
            var target_abs_x = target_position[0] * state.tile_w;
            var target_abs_y = target_position[1] * state.tile_h
            
            // Position of tile relative to selection
            var relative_x = this.x - target_abs_x;
            var relative_y = this.y - target_abs_y;

            //Get intersection of tile and selection
            var tile_clip_x = Math.max(0, relative_x);
            var tile_clip_y = Math.max(0, relative_y);

            var copy_x = -Math.min(0, relative_x);
            var copy_y = -Math.min(0, relative_y);
            var copy_w = Math.min(this.x + this.w, target_abs_x + state.tile_w) - Math.max(this.x, target_abs_x);
            var copy_h = Math.min(this.y + this.h, target_abs_y + state.tile_h) - Math.max(this.y, target_abs_y);
            
            //Draw selection onto each mapped tile
            tile.painted_positions.forEach(position => {
                var absolute_x = position[0] * state.tile_w + tile_clip_x;
                var absolute_y = position[1] * state.tile_h + tile_clip_y;
                state.current_layer.render_ctx.drawImage(this.paste_canvas, copy_x, copy_y, copy_w, copy_h, 
                                                         absolute_x, absolute_y, copy_w, copy_h);
            })

            tile.ctx.drawImage(this.paste_canvas, relative_x, relative_y);
        }

        state.current_layer.render_ctx.drawImage(this.paste_canvas, this.x, this.y);

        state.canvas_handler.redraw_background();
        state.canvas_handler.render_drawing();
        state.preview_canvas.redraw();
    }

    toggle_resizers(){
        for(var i = 0; i < 16; i++){
            if(this.transform){
                this.selection_rect.style.outline = "1px solid black"
                this.frame_selection_rect.style.outline = "1px solid black"
                this.resizers[i].style.display = "block";
            } else {
                this.selection_rect.style.outline = "1px solid red"
                this.frame_selection_rect.style.outline = "1px solid red"
                this.resizers[i].style.display = "none";
            }
        }
    }

    update_frame_selection(){
        if(state.frame_pos == null) { return; }
        var zoom = state.frame_canvas.zoom
        this.frame_selection_rect.style.left = (this.x - state.frame_pos[0]) * zoom + "px";
        this.frame_selection_rect.style.top = (this.y - state.frame_pos[1]) * zoom + "px";
        this.frame_selection_rect.style.width = this.w * zoom + "px";
        this.frame_selection_rect.style.height = this.h * zoom + "px";

        this.frame_selection_rect.style.display = this.exists ? "block" : "none";
        state.frame_canvas.wrapper.style.overflow = this.transform ? "visible" : "hidden";

        state.frame_canvas.render();
    }

    clip_to_frame(){
        this.x = Math.max(this.x, state.frame_pos[0]);
        this.y = Math.max(this.y, state.frame_pos[1]);
        this.w = Math.min(this.x + this.w, state.frame_pos[0] + state.tile_w) - this.x;
        this.h = Math.min(this.y + this.h, state.frame_pos[1] + state.tile_h) - this.y;
    }
}
