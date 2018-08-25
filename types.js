class Selection{
    constructor(){
        this.x = state.canvas_wrapper.offsetLeft;
        this.y = state.canvas_wrapper.offsetTop;
        this.w = state.main_canvas.w;
        this.h = state.main_canvas.h;
        this.true_w = state.main_canvas.canvas.width;
        this.true_h = state.main_canvas.canvas.height;

        // If a selection exists, this is true
        this.exists = false;

        // If the user is making a selection, this is true
        this.forming = false;

        // If the user is dragging a selection, this is true
        this.being_dragged = false;

        // Separate canvases to draw the selection, so that a massive canvas isn't needed
        this.top_border = document.getElementById("selection-top");
        this.left_border = document.getElementById("selection-left");
        this.bottom_border = document.getElementById("selection-bottom");
        this.right_border = document.getElementById("selection-right");

        this.top_ctx = this.top_border.getContext("2d")
        this.left_ctx = this.left_border.getContext("2d")
        this.bottom_ctx = this.bottom_border.getContext("2d")
        this.right_ctx = this.right_border.getContext("2d")
    }

    to_canvas_space(){
        return {
            x: (this.x - state.canvas_wrapper.offsetLeft)/state.main_canvas.current_zoom,
            y: (this.y - state.canvas_wrapper.offsetTop)/state.main_canvas.current_zoom
        }
    }

    draw(){
        var x1 = state.mouse_start[0] * state.main_canvas.current_zoom;
        var y1 = state.mouse_start[1] * state.main_canvas.current_zoom;
        var x2 = state.selection_end[0] * state.main_canvas.current_zoom;
        var y2 = state.selection_end[1] * state.main_canvas.current_zoom;

        var pixel_size = state.main_canvas.current_zoom;

        if (x1 == x2 && y1 == y2){ 
            this.draw_selection(x1, y1, x1 + pixel_size, y1 + pixel_size); 
        }
        else if (x1 < x2 && y1 == y2){
            this.draw_selection(x1, y1, x2 + pixel_size, y1 + pixel_size);
        }
        else if (x1 <= x2 && y1 < y2){
            this.draw_selection(x1, y1, x2 + pixel_size, y2 + pixel_size);
        }
        else if (x2 < x1 && y2 > y1){
            this.draw_selection(x2, y1, x1 + pixel_size, y2 + pixel_size);
        }
        else if (x2 < x1 && y2 == y1){
            this.draw_selection(x2, y2, x1 + pixel_size, y2 + pixel_size);
        }
        else if (x2 <= x1 && y2 < y1){
            this.draw_selection(x2, y2, x1 + pixel_size, y1 + pixel_size);
        }
        else if (y2 < y1 && x1 < x2){
            this.draw_selection(x1, y2, x2 + pixel_size, y1 + pixel_size);
        }
    }

    draw_selection(x1, y1, x2, y2){
        x1 += state.canvas_wrapper.offsetLeft;
        x2 += state.canvas_wrapper.offsetLeft;
        y1 += state.canvas_wrapper.offsetTop;
        y2 += state.canvas_wrapper.offsetTop;
        var w = x2 - x1;
        var h = y2 - y1;

        this.top_border.width = w;
        this.left_border.height = h;
        this.bottom_border.width = w;
        this.right_border.height = h;

        this.top_border.style.left = x1 + "px";
        this.top_border.style.top = y1 + "px";
        this.left_border.style.left = x1 + "px";
        this.left_border.style.top = y1 + "px";
        this.bottom_border.style.left = x1 + "px";
        this.bottom_border.style.top = y2 - 1 + "px";
        this.right_border.style.left = x2 - 1 + "px";
        this.right_border.style.top = y1 + "px";

        this.top_ctx.fillStyle = "red";
        this.left_ctx.fillStyle = "red";
        this.bottom_ctx.fillStyle = "red";
        this.right_ctx.fillStyle = "red";

        this.top_ctx.fillRect(0, 0, w, 1);
        this.left_ctx.fillRect(0, 0, 1, h);
        this.bottom_ctx.fillRect(0, 0, w, 1);
        this.right_ctx.fillRect(0, 0, 1, h);

        this.x = x1;
        this.y = y1;
        this.w = w/state.main_canvas.current_zoom;
        this.h = h/state.main_canvas.current_zoom;
        this.true_w = w;
        this.true_h = h;
        this.exists = true;
    }

    get_intersection(){
        if(this.y + this.true_h <= state.canvas_wrapper.offsetTop || this.y >= state.canvas_wrapper.offsetTop + state.canvas_wrapper.clientHeight ||
          this.x + this.true_w <= state.canvas_wrapper.offsetLeft || this.x >= state.canvas_wrapper.offsetLeft + state.canvas_wrapper.clientWidth ||
          !this.exists) {
              this.clear();
              return;
        }
        var x1 = Math.max(this.x,  state.canvas_wrapper.offsetLeft) - state.canvas_wrapper.offsetLeft;
        var y1 = Math.max(this.y, state.canvas_wrapper.offsetTop) - state.canvas_wrapper.offsetTop;
        var x2 = Math.min(this.x + this.true_w,  state.canvas_wrapper.offsetLeft + state.canvas_wrapper.clientWidth) - state.canvas_wrapper.offsetLeft;
        var y2 = Math.min(this.y + this.true_h,  state.canvas_wrapper.offsetTop + state.canvas_wrapper.clientHeight) - state.canvas_wrapper.offsetTop;
        this.draw_selection(x1, y1, x2, y2);
    }

    clear(){
        this.top_ctx.clearRect(0, 0, this.w * state.main_canvas.current_zoom, 1);
        this.left_ctx.clearRect(0, 0, 1, this.h * state.main_canvas.current_zoom);
        this.bottom_ctx.clearRect(0, 0, this.w * state.main_canvas.current_zoom, 1);
        this.right_ctx.clearRect(0, 0, 1, this.h * state.main_canvas.current_zoom);
        this.exists = false;
        this.wrap_around_canvas();
    }

    wrap_around_canvas(){
        this.x = state.canvas_wrapper.offsetLeft;
        this.y = state.canvas_wrapper.offsetTop;
        this.w = state.main_canvas.w
        this.h = state.main_canvas.h
        this.true_w = state.main_canvas.canvas.width;
        this.true_h = state.main_canvas.canvas.height;
    }

    contains_mouse(){
        var x = state.abs_mouse_pos[0];
        var y = state.abs_mouse_pos[1];
        return (x >= this.x + state.canvas_area.offsetLeft &&
                x <= this.x + state.canvas_area.offsetLeft + this.true_w &&
                y >= this.y + state.canvas_area.offsetTop &&
                y <= this.y + state.canvas_area.offsetTop + this.true_h)
    }

    contains_pixel_pos(x, y){
        var pos = this.to_canvas_space();
        return (x >= pos.x && y >= pos.y && x < pos.x + this.w && y < pos.y + this.h)
    }

    move(){
        this.x += state.delta_mouse[0];
        this.y += state.delta_mouse[1];
        if(this.exists){
            this.draw_selection(this.x - state.canvas_wrapper.offsetLeft, this.y - state.canvas_wrapper.offsetTop, this.x + this.true_w - state.canvas_wrapper.offsetLeft, this.y + this.true_h - state.canvas_wrapper.offsetTop);
        }
    }

    drag(){
        if (!this.exists) { return; }
        this.x += state.delta_pixel_pos[0] * state.main_canvas.current_zoom;
        this.y += state.delta_pixel_pos[1] * state.main_canvas.current_zoom;
        this.draw_selection(this.x - state.canvas_wrapper.offsetLeft, this.y - state.canvas_wrapper.offsetTop, this.x + this.true_w - state.canvas_wrapper.offsetLeft, this.y + this.true_h - state.canvas_wrapper.offsetTop);
    }

    resize(){
        if(!this.exists) { return; }

        var old_zoom = state.main_canvas.prev_zoom
        var old_pixel_x = (this.x - state.canvas_wrapper.offsetLeft)/state.main_canvas.prev_zoom;
        var old_pixel_y = (this.y - state.canvas_wrapper.offsetTop)/state.main_canvas.prev_zoom;
        var new_zoom = state.main_canvas.current_zoom;

        var delta_x = old_pixel_x * new_zoom - old_pixel_x * old_zoom;
        var delta_y = old_pixel_y * new_zoom - old_pixel_y * old_zoom;

        var new_x = this.x + delta_x - canvas_wrapper.offsetLeft;
        var new_y = this.y + delta_y - canvas_wrapper.offsetTop;

        var new_w = this.w * new_zoom;
        var new_h = this.h * new_zoom;

        this.draw_selection(new_x, new_y, new_x + new_w, new_y + new_h);
    }
}

class Slider{
    constructor(type, name, w, h, max_value){
        this.name = name;
        this.type = type;
        this.height = h;
        this.width = w;
        this.max_value = max_value
        this.value = 0
        if(type == "square"){
            this.value = [0, 0];
        }
        this.init(w, h);
    }

    init(w, h){
        this.wrapper = document.getElementById(this.name);
        this.wrapper.style.width = w + "px";
        this.wrapper.style.height = h + "px";
        this.wrapper.style.borderRadius = w + "px";
        
        this.selector = document.createElement("div");
        if(this.type != "square"){
            this.wrapper.style.position = "relative";
            this.selector.style.width = w * 2 + "px";
            this.selector.style.height = w * 2 + "px";
            this.selector.style.left = -0.5 * w + "px";
            this.selector.style.top = -w + "px";
        } else {
            this.selector.style.width = "20px";
            this.selector.style.height = "20px";
            this.selector.style.top = "-10px";
            this.selector.style.left = "-10px";
        }
        this.selector.style.borderRadius = w + "px";
        this.selector.style.boxShadow = "0px 0px 0px 2px white inset";
        this.selector.style.position = "absolute"

        this.wrapper.appendChild(this.selector);

        this.min_x = this.selector.offsetLeft;
        this.max_x = this.selector.offsetLeft + w;
        this.min_y = this.selector.offsetTop;
        this.max_y = this.selector.offsetTop + h;

        this.add_events(this);
    }

    add_events(owner){
        this.selector.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.selector;
            owner.move_slider();
            state.color_picker.update_color(owner.name);
        }
        this.wrapper.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.selector;
            owner.move_slider();
            state.color_picker.update_color(owner.name);
        }
        mouse_move_functions.push(function(){
            if(state.active_element == owner.selector){
                owner.move_slider();
                state.color_picker.update_color(owner.name);
            }
        })
    }

    update_position(value_y, value_x = null){
        if(this.type == "vertical"){
            this.selector.style.top = -this.width + value_y * this.height / this.max_value + "px";
        } else if (this.type == "square"){
            this.selector.style.top = -10 + value_y * this.height / this.max_value + "px";
            this.selector.style.left = -10 + value_x * this.width / this.max_value + "px";
            this.value[0] = this.selector.offsetLeft - this.min_x;
            this.value[1] = this.selector.offsetTop - this.min_y;
        }
    }

    move_slider(){
        if(this.type == "vertical"){
            this.selector.style.top = this.selector.offsetTop - this.selector.getBoundingClientRect().y + state.abs_mouse_pos[1] + this.min_y + "px";
            this.clamp_y();
            this.value = this.height - (this.selector.offsetTop - this.min_y);
        } else if (this.type == "square"){
            this.selector.style.left = this.selector.offsetLeft - this.selector.getBoundingClientRect().x + state.abs_mouse_pos[0] + this.min_x + "px";
            this.selector.style.top = this.selector.offsetTop - this.selector.getBoundingClientRect().y + state.abs_mouse_pos[1] + this.min_y + "px";
            this.clamp_x();
            this.clamp_y();
            this.value[0] = this.selector.offsetLeft - this.min_x;
            this.value[1] = this.selector.offsetTop - this.min_y;
        }
    }

    clamp_x(){
        if(this.selector.offsetLeft < this.min_x){
            this.selector.style.left = this.min_x + "px";
        }
        if(this.selector.offsetLeft > this.max_x){
            this.selector.style.left = this.max_x + "px";
        }
    }

    clamp_y(){
        if(this.selector.offsetTop < this.min_y){
            this.selector.style.top = this.min_y + "px";
        }
        if(this.selector.offsetTop > this.max_y){
            this.selector.style.top = this.max_y + "px";
        }
    }
}

class Canvas{
    constructor(canvas, w, h){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.data = []
        this.w = w;
        this.h = h;
        
        this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18, 28, 38, 50, 70, 90, 128]
        this.current_zoom = 8;
        this.prev_zoom = 8;
        
        this.draw_buffer = []
        this.init_data();

        this.canvas.width = this.w * this.current_zoom;
        this.canvas.height = this.h * this.current_zoom;
        this.canvas.style.width = this.canvas.width;
        this.canvas.style.height = this.canvas.height;
    }

    zoom(direction){
        this.prev_zoom = this.current_zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(this.current_zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.current_zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.current_zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }

        this.canvas.width = this.w * this.current_zoom;
        this.canvas.height = this.h * this.current_zoom;

        this.draw_data();
    }

    init_data(){
        for(var x = 0; x < this.w; x++){
            this.data.push([]);
            for(var y = 0; y < this.h; y++){
                this.data[x].push(new Pixel_Data());
            }
        }
    }

    fill(x, y, new_color, old_color){
        var node = this.data[x][y];
        if(!state.current_selection.contains_pixel_pos(x, y)) { return; }
        if(rgba(node.rgba) == rgba(new_color)){ return; }
        if(rgba(node.rgba) == rgba(old_color)){
            node.rgba = new_color;
            node.color = rgba(new_color);

            if(y < this.h - 1){ this.fill(x, y + 1, new_color, old_color); }
            if(y > 0){ this.fill(x, y - 1, new_color, old_color); }
            if(x < this.w - 1){ this.fill(x + 1, y, new_color, old_color); }
            if(x > 0){ this.fill(x - 1, y, new_color, old_color); }
        }
    }

    draw_data(){
        for(var x = 0; x < this.w; x++){
            for(var y = 0; y < this.h; y++){
                this.draw_pixel(this.data[x][y].color, x * this.current_zoom, Math.round(y * this.current_zoom));
            }
        }
    }

    contains_mouse(){
        var x = state.abs_mouse_pos[0];
        var y = state.abs_mouse_pos[1];
        return (x >= this.canvas.getBoundingClientRect().x &&
                x <= this.canvas.getBoundingClientRect().x + this.canvas.width &&
                y >= this.canvas.getBoundingClientRect().y &&
                y <= this.canvas.getBoundingClientRect().x + this.canvas.height)
    }

    draw_rectangle(x1, y1, x2, y2){
        this.line(x1, y1, x2, y1);
        this.line(x1, y1, x1, y2);
        this.line(x1, y2, x2, y2);
        this.line(x2, y1, x2, y2);
    }

    draw_pixel(color, x, y){
        this.ctx.beginPath();
        this.ctx.rect(x, y, this.current_zoom, this.current_zoom);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    erase_pixel(x, y){
        if(state.transparency){
            this.ctx.clearRect(x * this.current_zoom, y * this.current_zoom, this.current_zoom, this.current_zoom);
            this.data[x][y].color = "hsla(0, 100%, 100%, 0)"
            this.data[x][y].rgba = [255, 255, 255, 0];
        } else {
            this.draw_pixel("rgb(255, 255, 255)", x * this.current_zoom, y * this.current_zoom);
            this.data[x][y].color = "hsla(0, 100%, 100%, 1)"
            this.data[x][y].rgba = [255, 255, 255, 1];
        }
    }

    line(x0, y0, x1, y1, erase = false){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.ctx.beginPath();
        while(true){
            if(state.current_selection.contains_pixel_pos(x0, y0)){
                if(erase){
                    if (state.current_selection.contains_mouse()){
                        this.erase_pixel(x0, y0);
                    }
                } else {
                    this.ctx.rect(x0 * this.current_zoom, y0 * this.current_zoom, this.current_zoom, this.current_zoom);
                    this.data[x0][y0].filled = true;
                    this.data[x0][y0].color = state.color_picker.current_color;
                    this.data[x0][y0].rgba = state.color_picker.current_rgba;
                }
                this.ctx.fillStyle = state.color_picker.current_color;
                this.ctx.fill();
            }
    
            if ((x0==x1) && (y0==y1)) {
                break;
            }
    
            var e2 = 2*err;
            
            if (e2 >-dy){ 
                err -= dy; 
                x0 += sx;
            }
            
            if (e2 < dx){ 
                err += dx; 
                y0 += sy; 
            }
        }
    }

    resize(w, h){
        this.canvas.width = w;
        this.canvas.height = h;
    }

    clear_selection(){
        var x = state.current_selection.x - state.canvas_wrapper.offsetLeft;
        var y = state.current_selection.y - state.canvas_wrapper.offsetTop;
        this.clear_rect(x, y, state.current_selection.true_w, state.current_selection.true_h)
        this.draw_data();
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }

    clear_rect(x1, y1, w, h){
        this.ctx.clearRect(x1, y1, w, h);
        w /= state.main_canvas.current_zoom;
        h /= state.main_canvas.current_zoom;
        x1 /= state.main_canvas.current_zoom;
        y1 /= state.main_canvas.current_zoom;
        for(var x = x1; x < x1 + w; x++){
            for(var y = y1; y < y1 + h; y++){
                this.data[x][y].color = "transparent";
                this.data[x][y].rgba = [255, 255, 255 ,0]
            }
        }
    }
}

function Pixel_Data(){
    this.color = "hsla(0, 100%, 100%, 0)";
    this.rgba = [255, 255, 255, 0];
}

class Button_Slider{
    constructor(name, button_name, width, default_val, max_length, type, max_value){
        this.name = name;
        this.max_value = max_value;
        this.init(name, button_name, width, default_val, max_length, type);
    }

    init(name, button_name, width, default_val, max_length, type){
        var name_elem = document.createElement("span");
        var input_wrapper = document.createElement("div");
        var slider_wrapper = document.createElement("div");
        this.wrapper = document.getElementById(name);
        this.input = document.createElement("input");

        slider_wrapper.id = this.name + "-input-slider";
        name_elem.className = "button-slider-name";
        input_wrapper.className = "button-slider-input-wrapper";
        this.input.className = "button-slider-input";

        name_elem.innerHTML = button_name + ":"; 

        this.input.style.width = width + "px";
        this.input.value = default_val;
        this.input.maxLength = max_length;
        
        if(type == "hex"){
            this.input.onkeypress = is_hex;
            this.input.onchange = this.hex_onchange(this, this.input);
        } else if (type == "number") {
            this.input.onkeypress = is_number;
            this.input.oninput = this.number_oninput(this, this.input);
            this.caret = document.createElement("i")
            this.caret.className = "fas fa-caret-down button-slider-caret";
            input_wrapper.appendChild(this.caret);
            this.add_events(this);
        }
        
        this.wrapper.appendChild(name_elem);
        this.wrapper.appendChild(input_wrapper);
        this.wrapper.appendChild(slider_wrapper);
        input_wrapper.appendChild(this.input);

        this.slider = new Slider("vertical", slider_wrapper.id , 6, 100, this.max_value);
        this.slider.wrapper.className = "button-slider-slider";
        this.slider.wrapper.style.position = "absolute";
        this.slider.wrapper.style.top = -this.height + "px";
        this.slider.selector.style.backgroundColor = "grey";
    }

    add_events(owner){
        this.caret.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.slider.selector;
            owner.slider.wrapper.style.display = "block";
            owner.set_slider_pos();
            owner.update_slider();
        }
        mouse_up_functions.push(function(){
            if(state.active_element == owner.slider.selector){
                owner.slider.wrapper.style.display = "none";
            }
        })
    }

    set_slider_pos(){
        var mouse_diff = this.caret.getBoundingClientRect().y - state.abs_mouse_pos[1];
        this.slider.wrapper.style.top = -100 + this.slider.value - mouse_diff + "px";
    }

    update_slider(){
        this.slider.move_slider();
        state.color_picker.update_color(this.slider.name);
    }

    slider_to_input(){
        return Math.round(this.slider.value * this.max_value / this.slider.height);
    }

    input_to_slider(){
        return Math.round(this.input.value * this.slider.height/ this.max_value);
    }

    number_oninput(owner, input_elem){
        return function(){
            var leading_zero = /^0[0-9].*$/;
            if(leading_zero.test(input_elem.value)){
                input_elem.value = parseInt(input_elem.value, 10);
            }
            if(input_elem.value > owner.max_value){
                input_elem.value = owner.max_value;
            }
            if (input_elem.value.length == 0){
                input_elem.value = 0;
            }
            state.color_picker.update_color(owner.name);
        }
    }

    hex_onchange(owner, input_elem){
        return function(){
            switch (input_elem.value.length){
                case 0:
                    input_elem.value = "000000"
                    break;
                case 1:
                    input_elem.value = "00000" + input_elem.value;
                    break;
                case 2:
                    input_elem.value = "0000" + input_elem.value;
                    break;
                case 3:
                    input_elem.value = input_elem.value[0] + input_elem.value[0] + input_elem.value[1] + input_elem.value[1] + input_elem.value[2] + input_elem.value[2] 
                    break;
                case 4:
                    input_elem.value = "00" + input_elem.value;
                    break;
                case 5:
                    input_elem.value = "0" + input_elem.value;
                    break
            }
            state.color_picker.update_color(owner.name);
        }
    }
}