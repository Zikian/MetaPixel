class Animator{
    constructor(){
        this.animations = [];
        this.wrapper = document.getElementById("animator-body");
        this.animations_window_body = document.getElementById("animations-window-body");
        this.frames_window_body = document.getElementById("frames-window-body")

        var input_func = function(){
            var delay = state.animator.frame_delay_input.input.value;
            if(delay.length == 0) { delay = 1; }
            state.current_anim.current_frame().delay = delay;
        }
        this.frame_delay_input = new Input("number", "frame-delay-input", "Frame Delay", 60, 100, 5, input_func);

        var resizer = document.getElementById("animator-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = function(){
            var height = document.body.offsetHeight - event.clientY - 10;
            state.animator.wrapper.style.height = height > 0
                ? clamp(height, 0, 600) + "px"
                : 0;
            state.canvas_handler.move_canvas(0, 0); //Reset canvas clip because editor is resized
        }

        var animations_window_resizer = document.getElementById("animations-window-resizer");
        animations_window_resizer.onmousedown = set_active_element;
        animations_window_resizer.mousedrag_actions = function(){
            var width = event.clientX - state.animator.animations_window_body.offsetLeft;
            document.getElementById("animations-window-body").style.width = clamp(width, 100, 500) - 4 + "px";
        }

        document.getElementById("add-animation").onclick = function(){
            state.animator.add_animation();
            state.history_manager.add_history("add-animation");
        }

        document.getElementById("delete-animation").onclick = function(){
            if(state.animator.animations.length == 0) { return; };
            state.history_manager.add_history("delete-animation", [state.current_anim])
            state.animator.delete_animation(state.current_anim.index);
        }

        document.getElementById("prev-frame").onclick = function(){
            state.animator.change_frame("prev");
        }

        document.getElementById("next-frame").onclick = function(){
            state.animator.change_frame("next");
        }

        this.resize_anim_bounds();
    }

    resize_anim_bounds(){
        var w = state.tile_w * state.zoom;
        var h = state.tile_h * state.zoom;
        state.anim_start_rect.style.width = w / 2 + "px";
        state.anim_start_rect.style.height = h - 0.5 + "px";
        state.anim_end_rect.style.width = w / 2 + "px";
        state.anim_end_rect.style.height = h - 1 + "px"; 
        state.frame_indicator.style.width = w - 1 + "px";
        state.frame_indicator.style.height = h - 1 + "px"; 
    }

    reposition_anim_bounds(anim){
        if(state.tile_w * state.zoom < 32 || state.tile_h * state.zoom < 32) {
            this.hide_anim_rects();
            return;
        }
        
        if(!this.animations.length) { return; }
        state.anim_start_rect.style.left = tile_x(anim.frames[0].x) - 1 + "px";
        state.anim_start_rect.style.top = tile_y(anim.frames[0].y) - 1.5 + "px";
        state.anim_end_rect.style.left = tile_x(anim.frames[anim.length - 1].x) + state.tile_w * state.zoom / 2 + "px";
        state.anim_end_rect.style.top = tile_y(anim.frames[anim.length - 1].y) - 1 + "px";
    }

    update_frame_indicator(){
        if(!this.animations.length) { return; }
        var frame = state.current_anim.current_frame();
        state.frame_indicator.style.left = tile_x(frame.x) + "px";
        state.frame_indicator.style.top = tile_y(frame.y) + "px";
    }

    hide_anim_rects(){
        state.anim_start_rect.style.left = "-9999px";
        state.anim_end_rect.style.left = "-9999px";
        state.frame_indicator.style.left = "-9999px";
    }

    add_animation(){
        this.animations.push(new Animation(this.animations.length));
        this.change_animation(this.animations.length - 1);
    }

    delete_animation(index){
        this.animations[index].delete();
        this.animations.splice(index, 1);

        if(!this.animations.length) { 
            this.hide_anim_rects();
            state.frame_pos = null;
            state.frame_canvas.clear();
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
        if(!state.current_anim.length) { return; }

        switch(direction){
            case "next":
                state.current_anim.frame_index += 1;
                break;
            case "prev":
                state.current_anim.frame_index = state.current_anim.frame_index == 0
                    ? state.current_anim.length - 1
                    : state.current_anim.frame_index - 1;
                break;
        }

        state.current_anim.frame_index %= state.current_anim.length;
        
        state.current_anim.update_frame_pos();
        this.update_delay_input();
        this.update_frame_indicator();
        state.frame_canvas.render();
        state.selection.update_frame_selection();
    }

    change_animation(index){
        if(state.current_anim){ state.current_anim.set_inactive(); }
        state.current_anim = this.animations[index];
        state.current_anim.set_active();

        if(!state.current_anim.length){
            this.hide_anim_rects();
            state.frame_canvas.clear();
        } else {
            this.reposition_anim_bounds(state.current_anim);
            this.update_frame_indicator();
            state.current_anim.update_frame_pos();
            state.frame_canvas.render();
        }
    }

    update_delay_input(){
        this.frame_delay_input.input.value = state.current_anim.current_frame().delay;
    }
}

class Animation{
    constructor(index){
        this.index = index;
        this.frame_index = 0;
        this.frames = [];
        this.length = 0;

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

    }

    current_frame(){
        return this.frames[this.frame_index];
    }

    set_inactive(){
        this.wrapper.style.backgroundColor = "rgb(59, 59, 65)";
    }

    set_active(){
        this.wrapper.style.backgroundColor = "rgb(38, 38, 43)";
    }

    delete(){
        state.animator.animations_window_body.removeChild(this.wrapper);
    }

    update_frame_pos(){
        var x = this.current_frame().x * state.tile_w;
        var y = this.current_frame().y * state.tile_h;
        state.frame_pos = [x, y];
    }

    populate_frames(start_index, anim_length){
        for(var i = 0; i < anim_length - this.length; i++){
            this.frames.push({ 
                delay: 100
            });
        }
        this.length = anim_length;
        this.update_frame_positions(start_index);
    }

    update_frame_positions(start_index){
        for(var i = 0; i < this.length; i++){
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

        document.getElementById("frame-zoom-in").onclick = function(){
            state.frame_canvas.zoom_canvas("in");
        }
        document.getElementById("frame-zoom-out").onclick = function(){
            state.frame_canvas.zoom_canvas("out");
        }

        this.mouse_indicator = document.getElementById("frame-mouse-indicator");
        this.mouse_indicator.style.width = this.zoom + "px";
        this.mouse_indicator.style.height = this.zoom + "px";
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

        state.selection.update_frame_selection();
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
        this.ctx.drawImage(state.selection.paste_canvas, state.selection.x - state.frame_pos[0], state.selection.y - state.frame_pos[1]);
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
        this.frame_index = 0;
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
        
        var anim_preview_resizer = document.getElementById("anim-preview-resizer");
        anim_preview_resizer.onmousedown = set_active_element;
        anim_preview_resizer.mousedrag_actions = function(){
            var width = anim_preview_body.getBoundingClientRect().x + anim_preview_body.offsetWidth - event.clientX;
            anim_preview_body.style.width = clamp(width, 150, 500) - 4 + "px";
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
            owner.prev_time = (new Date()).getTime();
            owner.drew_frame = false;
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

        document.getElementById("anim-preview-zoom-in").onclick = function(){
            owner.zoom_preview("in");
        }
        document.getElementById("anim-preview-zoom-out").onclick = function(){
            owner.zoom_preview("out");
        }


    }

    zoom_preview(direction){
        var current_zoom_index = this.zoom_stages.indexOf(this.zoom);
        if(direction == "in" && current_zoom_index < this.zoom_stages.length - 1){
            this.zoom = this.zoom_stages[current_zoom_index + 1];
        }
        if(direction == "out" && current_zoom_index > 0){
            this.zoom = this.zoom_stages[current_zoom_index - 1];
        }

        this.canvas.style.width = state.tile_w * this.zoom + "px";
        this.canvas.style.height = state.tile_h * this.zoom + "px";
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
                owner.draw_frame(state.current_anim, owner.frame_index);
                owner.drew_frame = true;
            }
            
            if(owner.frame_index == state.current_anim.length - 1 && !owner.repeat){ 
                owner.frame_index = 0;
                owner.toggle_play();
            }
            if(!owner.playing) { return; }
            
            var current_time = (new Date()).getTime();
            var frame_delay = state.current_anim.frames[owner.frame_index].delay;
            if(current_time - owner.prev_time >= frame_delay){
                owner.prev_time = current_time;
                owner.frame_index++;
                owner.frame_index %= state.current_anim.length
                owner.drew_frame = false;
            }

            window.requestAnimationFrame(owner.play_animation(owner));
        }
    }
}
