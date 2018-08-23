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

        this.canvas_width = this.current_zoom * this.w;
        this.canvas_height = this.current_zoom * this.h;
        
        this.draw_buffer = []
        this.init_data();

        this.canvas.width = this.canvas_width;
        this.canvas.height = this.canvas_height;
        this.canvas.style.width = this.canvas_width;
        this.canvas.style.height = this.canvas_height;
    }

    zoom(direction){
        var prev_zoom = this.current_zoom;
        var zoom_stage_index = this.zoom_stages.indexOf(this.current_zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.current_zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.current_zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }

        var y1 = state.abs_mouse_pos[1];
        var h1 = this.h * prev_zoom;
        var h2 = this.h * this.current_zoom;
        var y2 = y1 * h2 / h1;
        var deltaY = y2 - y1;

        this.canvas_width = this.current_zoom * this.w;
        this.canvas_height = this.current_zoom * this.h;
        this.canvas.width = this.canvas_width;
        this.canvas.height = this.canvas_height;

        drag_element(state.canvas_wrapper, [0, 0]);
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
        if(rgba(node.rgba) == rgba(old_color)){
            node.rgba = new_color;
            node.color = state.color_picker.current_color;

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

    draw_selection(x1, y1, x2, y2){
        this.ctx.strokeStyle = 'red'; 
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(x1,y1);
        this.ctx.lineTo(x1,y2);
        this.ctx.stroke();
        this.ctx.moveTo(x1,y1);
        this.ctx.lineTo(x2,y1);
        this.ctx.stroke();
        this.ctx.moveTo(x2,y2);
        this.ctx.lineTo(x2,y1);
        this.ctx.stroke();
        this.ctx.moveTo(x2,y2);
        this.ctx.lineTo(x1,y2);
        this.ctx.stroke();
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
            this.data[x][y].rgba = [0, 0, 0, 0];
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
        
        while(true){
            this.ctx.beginPath();
            if(this.contains(x0, y0)){
                if(erase){
                    this.erase_pixel(x0, y0);
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
    
    contains(x, y){
        return (x >= 0 && x < this.w && y >= 0 && y < this.h);
    }

    resize(w, h){
        this.canvas.width = w;
        this.canvas.height = h;
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
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