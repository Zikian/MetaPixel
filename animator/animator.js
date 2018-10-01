class Animator{
    constructor(){
        this.animations = [];

        this.wrapper = document.getElementById("animator-body");

        var resizer = document.getElementById("animator-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = function(){
            var height = document.body.offsetHeight - event.clientY - 10;
            if(height > 0){
                state.animator.wrapper.style.height = clamp(height, 0, 300) + "px"
            } else {
                state.animator.wrapper.style.height = "0px"
            }
        }

        this.animations_window_body = document.getElementById("animations-window-body")
        var animations_window_resizer = document.getElementById("animations-window-resizer");
        animations_window_resizer.onmousedown = set_active_element;
        animations_window_resizer.mousedrag_actions = function(){
            var width = event.clientX - state.animator.animations_window_body.offsetLeft;
            document.getElementById("animations-window-body").style.width = clamp(width, 100, 300) - 4 + "px";
        }

        this.frames_window_body = document.getElementById("frames-window-body")

        var add_animation_button = document.getElementById("add-animation");
        add_animation_button.onclick = function(){
            state.animator.add_animation();
            state.history_manager.add_history("add-animation");
        }

        var delete_animation_button = document.getElementById("delete-animation");
        delete_animation_button.onclick = function(){
            if(state.animator.animations.length == 0) { return; };
            state.history_manager.add_history("delete-animation", [state.current_anim])
            state.animator.delete_animation(state.current_anim.index);
        }

        var prev_frame_button = document.getElementById("prev-frame");
        prev_frame_button.onclick = function(){
            state.animator.change_frame("prev");
        }

        var next_frame_button = document.getElementById("next-frame");
        next_frame_button.onclick = function(){
            state.animator.change_frame("next");
        }

        var input_func = function(){
            var delay = state.animator.frame_delay_input.input.value;
            if(delay.length == 0) { delay = 1; }
            state.current_anim.frames[state.current_anim.current_frame].delay = delay;
        }
        this.frame_delay_input = new Input("number", "frame-delay-input", "Frame Delay", 60, 100, 5, input_func);

        this.update_anim_bounds_size();
    }

    update_anim_bounds_size(){
        var w = state.tile_w * state.zoom;
        var h = state.tile_h * state.zoom;
        state.anim_start_rect.style.width = w / 2 + "px";
        state.anim_start_rect.style.height = h + "px";
        state.anim_end_rect.style.width = w / 2 + "px";
        state.anim_end_rect.style.height = h + "px"; 
        state.current_frame_indicator.style.width = w + "px";
        state.current_frame_indicator.style.height = h + "px"; 
    }

    reposition_anim_bounds(anim){
        if(this.animations.length == 0) { return; }
        state.anim_start_rect.style.left = tile_x(anim.frames[0].x) - 2 + "px";
        state.anim_start_rect.style.top = tile_y(anim.frames[0].y) - 1 + "px";
        state.anim_end_rect.style.left = tile_x(anim.frames[anim.frames.length - 1].x) + state.tile_w * state.zoom / 2 + "px";
        state.anim_end_rect.style.top = tile_y(anim.frames[anim.frames.length - 1].y) - 1 + "px";
    }

    update_current_frame_indicator(){
        if(this.animations.length == 0) { return; }
        var current_frame = state.current_anim.frames[state.current_anim.current_frame];
        state.current_frame_indicator.style.left = tile_x(current_frame.x) - 1 + "px";
        state.current_frame_indicator.style.top = tile_y(current_frame.y) - 1 + "px";
    }

    hide_anim_rects(){
        state.anim_start_rect.style.left = "-9999px";
        state.anim_end_rect.style.left = "-9999px";
        state.current_frame_indicator.style.left = "-9999px";
    }

    add_animation(){
        this.animations.push(new Animation(this.animations.length));
        this.change_animation(this.animations.length - 1);
    }

    delete_animation(index){
        this.animations[index].delete();
        this.animations.splice(index, 1);
        if(this.animations.length == 0) { 
            this.hide_anim_rects();
            state.frame_pos = null;
            return; 
        }
        this.change_animation(0);
        this.reposition_animations();
    }

    reposition_animations(){
        for(var i = 0; i < this.animations.length; i++){
            this.animations[i].wrapper.style.top = i * 30 + "px";
            this.animations[i].index = i;
        }
    }

    change_frame(direction){
        if(state.current_anim.frames.length == 0) { return; }

        if(direction == "next"){
            state.current_anim.current_frame += 1;

        } else if (direction == "prev") {
            state.current_anim.current_frame -= 1;
            if(state.current_anim.current_frame < 0) { 
                state.current_anim.current_frame = state.current_anim.frames.length - 1;
            }
        }
        state.current_anim.current_frame %= state.current_anim.frames.length;

        state.current_anim.update_frame_pos();
        this.frame_delay_input.input.value = state.current_anim.frames[state.current_anim.current_frame].delay;
        this.update_current_frame_indicator();
        state.frame_canvas.render();
        state.frame_canvas.update_selection();
    }

    change_animation(index){
        if(state.current_anim != null){
            state.current_anim.wrapper.style.backgroundColor = "rgb(59, 59, 65)";
        }
        state.current_anim = this.animations[index];
        state.current_anim.wrapper.style.backgroundColor = "rgb(38, 38, 43)";
        if(state.current_anim.frames.length == 0){
            state.anim_start_rect.style.left = -9999 + "px";
            state.anim_end_rect.style.left = -9999 + "px";
        } else {
            this.reposition_anim_bounds(state.current_anim);
            this.update_current_frame_indicator();
            state.current_anim.update_frame_pos();
        }
    }
}

class Animation{
    constructor(index){
        this.index = index;
        this.current_frame = 0;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "animation";
        this.wrapper.style.top = index * 30 + "px";

        var owner = this;
        this.wrapper.onclick = function(){
            state.animator.change_animation(owner.index);
        }

        this.name_elem = document.createElement("span");
        this.name_elem.innerHTML = "Animation " + state.animator.animations.length;

        this.wrapper.appendChild(this.name_elem);
        state.animator.animations_window_body.appendChild(this.wrapper);

        this.frames = [];
    }

    delete(){
        state.animator.animations_window_body.removeChild(this.wrapper);
    }

    update_frame_pos(){
        var x = state.current_anim.frames[state.current_anim.current_frame].x * state.tile_w;
        var y = state.current_anim.frames[state.current_anim.current_frame].y * state.tile_h;
        state.frame_pos = [x, y];
    }

    populate_frames(start_index, anim_length){
        var start_x = start_index % state.tiles_x;
        var start_y = Math.floor(start_index / state.tiles_x);
        if(this.frames.length == 0){
            for(var i = 0; i < anim_length; i++){
                var frame = {
                    x: (start_index + i) % state.tiles_x,
                    y: Math.floor((start_index + i) / state.tiles_x),
                    delay: 100
                };
                this.frames.push(frame);
            }
        } else if (anim_length > this.frames.length || this.frames[0].x != start_x || this.frames[0].y != start_y){
            for(var i = 0; i < anim_length - this.frames.length; i++){
                this.frames.push({ delay: 100 });
            }
            this.update_frame_positions(start_index);
        }
    }

    update_frame_positions(start_index){
        for(var i = 0; i < this.frames.length; i++){
            this.frames[i].x = (start_index + i) % state.tiles_x;
            this.frames[i].y = Math.floor((start_index + i) / state.tiles_x);
        }
    }
}

class Frame_Canvas{
    constructor(){
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        
        var frames_window_body = document.getElementById("frames-window-body")
        
        var zoom = Math.floor(Math.min(frames_window_body.offsetWidth / state.tile_w, frames_window_body.offsetHeight / state.tile_h));
        for(var i = 0; i < this.zoom_stages.length - 1; i++){
            if(this.zoom_stages[i] <= zoom && zoom <= this.zoom_stages[i+1]){
                this.zoom = this.zoom_stages[i];
            }
        }

        this.canvas = document.getElementById("anim-frame-canvas");
        this.canvas.width = state.tile_w;
        this.canvas.height = state.tile_h;
        this.ctx = this.canvas.getContext("2d");

        this.wrapper = document.getElementById("frame-canvas-wrapper");
        this.wrapper.onmousedown = function(){
            if(state.frame_pos == null) { return; }
            state.active_element = this;
            state.selection.save();
            state.selection.clip_to_frame();
        };
        this.wrapper.mousedrag_actions = function(){
            state.drawbuffer.push(state.pixel_pos);
            state.tool_handler.current_tool.mousedrag_actions();
        }
        
        this.wrapper = document.getElementById("frame-canvas-wrapper");
        this.wrapper.style.width = state.tile_w * this.zoom + "px";
        this.wrapper.style.height = state.tile_h * this.zoom + "px";

        var zoom_in_button = document.getElementById("frame-zoom-in");
        zoom_in_button.onclick = function(){
            state.frame_canvas.zoom_canvas("in");
        }

        var zoom_out_button = document.getElementById("frame-zoom-out");
        zoom_out_button.onclick = function(){
            state.frame_canvas.zoom_canvas("out");
        }

        this.mouse_indicator = document.getElementById("frame-mouse-indicator");
        this.mouse_indicator.style.width = this.zoom + "px";
        this.mouse_indicator.style.height = this.zoom + "px";

        this.selection_rect = document.getElementById("frame-selection-rect");
    }

    update_selection(){
        if(state.frame_pos == null) { return; }
        this.selection_rect.style.left = (state.selection.x - state.frame_pos[0]) * this.zoom + "px";
        this.selection_rect.style.top = (state.selection.y - state.frame_pos[1]) * this.zoom + "px";
        this.selection_rect.style.width = state.selection.w * this.zoom + "px";
        this.selection_rect.style.height = state.selection.h * this.zoom + "px";
        if(state.selection.exists){
            this.selection_rect.style.display = "block"
        } else {
            this.selection_rect.style.display = "none"
        }
    }

    contains_mouse(){
        return (state.frame_pixel_pos[0] >= 0 &&
                state.frame_pixel_pos[1] >= 0 &&
                state.frame_pixel_pos[0] < state.tile_w &&
                state.frame_pixel_pos[1] < state.tile_h);
    }

    zoom_canvas(direction){
        var current_zoom_index = this.zoom_stages.indexOf(this.zoom);
        if(direction == "in" && current_zoom_index < this.zoom_stages.length - 1){
            this.zoom = this.zoom_stages[current_zoom_index + 1];
        }
        if(direction == "out" && current_zoom_index > 0){
            this.zoom = this.zoom_stages[current_zoom_index - 1];
        }

        this.wrapper.style.width = state.tile_w * this.zoom + "px";
        this.wrapper.style.height = state.tile_h * this.zoom + "px";
        this.mouse_indicator.style.width = this.zoom + "px";
        this.mouse_indicator.style.height = this.zoom + "px";

        this.update_selection();
    }

    update_mouse_indicator(){
        this.mouse_indicator.style.left = (state.frame_pixel_pos[0] - Math.floor(state.brush_size / 2)) * this.zoom + "px";
        this.mouse_indicator.style.top = (state.frame_pixel_pos[1] - Math.floor(state.brush_size / 2)) * this.zoom + "px";
    }

    clear(){
        this.ctx.clearRect(0, 0, state.tile_w, state.tile_h);
    }

    render(){
        if(state.frame_pos == null) { return; }
        this.clear();
        var target_rect = [...state.frame_pos, state.tile_w, state.tile_h];
        var frame_rect = [0, 0, state.tile_w, state.tile_h];
        this.ctx.drawImage(state.canvas_handler.background_canvas, ...target_rect, ...frame_rect);
        this.ctx.drawImage(state.canvas_handler.foreground_canvas, ...target_rect, ...frame_rect);
    }
    
    render_foreground(){
        if(state.frame_pos == null) { return; }
        var target_rect = [...state.frame_pos, state.tile_w, state.tile_h];
        var frame_rect = [0, 0, state.tile_w, state.tile_h];
        this.ctx.drawImage(state.canvas_handler.foreground_canvas, ...target_rect, ...frame_rect);
    }
    
    render_background(){
        if(state.frame_pos == null) { return; }
        this.clear();
        var target_rect = [...state.frame_pos, state.tile_w, state.tile_h];
        var frame_rect = [0, 0, state.tile_w, state.tile_h];
        this.ctx.drawImage(state.canvas_handler.background_canvas, ...target_rect, ...frame_rect);
    }
}

class Anim_Preview{
    constructor(){
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        this.current_frame = 0;
        this.drew_frame = false;
        this.prev_time = (new Date()).getTime();
        this.repeat = false;
        this.playing = false;
        
        var anim_preview_body = document.getElementById("anim-preview-body")
        var zoom = Math.floor(Math.min(anim_preview_body.offsetWidth / state.tile_w, anim_preview_body.offsetHeight / state.tile_h));
        for(var i = 0; i < this.zoom_stages.length - 1; i++){
            if(this.zoom_stages[i] <= zoom && zoom <= this.zoom_stages[i+1]){
                this.zoom = this.zoom_stages[i];
            }
        }
        
        this.canvas = document.getElementById("anim-preview-canvas");
        this.canvas.width = state.tile_w;
        this.canvas.height = state.tile_h;
        this.canvas.style.width = state.tile_w * this.zoom + "px";
        this.canvas.style.height = state.tile_h * this.zoom + "px";
        this.ctx = this.canvas.getContext("2d");

        var owner = this;
        this.play_button = document.getElementById("anim-preview-play");
        this.play_button.onclick = function(){
            owner.toggle_play();
            owner.play_animation(owner)();
        }
        this.play_icon = this.play_button.getElementsByClassName("fa-caret-right")[0];
        this.pause_icon = this.play_button.getElementsByClassName("fa-pause")[0];


        this.repeat_button = document.getElementById("anim-preview-repeat");
        this.repeat_button.onclick = function(){
            owner.repeat = !owner.repeat;
            owner.repeat
                ? this.style.backgroundColor = "rgb(26, 27, 32)"
                : this.style.backgroundColor = "transparent";
        }
    }

    toggle_play(){
        this.playing = !this.playing;
        if(this.playing){
            this.play_icon.style.display = "none";
            this.pause_icon.style.display = "block";
        } else {
            this.play_icon.style.display = "block";
            this.pause_icon.style.display = "none";
        }
    }

    draw_frame(anim, frame_index){
        this.ctx.clearRect(0, 0, state.tile_w, state.tile_h);
        var target_rect = [anim.frames[frame_index].x * state.tile_w, anim.frames[frame_index].y * state.tile_h, state.tile_w, state.tile_h];
        var frame_rect = [0, 0, state.tile_w, state.tile_h];
        this.ctx.drawImage(state.canvas_handler.background_canvas, ...target_rect, ...frame_rect);
        this.ctx.drawImage(state.canvas_handler.foreground_canvas, ...target_rect, ...frame_rect);
    }

    play_animation(owner){
        return function(){
            if(!owner.drew_frame){
                owner.draw_frame(state.current_anim, owner.current_frame);
                owner.drew_frame = true;
            }
            
            var current_time = (new Date()).getTime();
            var frame_delay = state.current_anim.frames[owner.current_frame].delay;
            if(current_time - owner.prev_time >= frame_delay){
                owner.current_frame++;
                owner.current_frame %= state.current_anim.frames.length;
                owner.prev_time = current_time;
                owner.drew_frame = false;
            }

            if(owner.current_frame == state.current_anim.frames.length - 1 && !owner.repeat){ 
                owner.current_frame = 0;
                owner.toggle_play();
            }
            if(!owner.playing) { return; }

            window.requestAnimationFrame(owner.play_animation(owner));
        }
    }
}
