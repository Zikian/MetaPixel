class Color_Picker{
    constructor(){
        this.selected_slider = null;
        this.position = [0, 0];
        this.window = document.getElementById("color-picker");
        this.header = document.getElementById("color-picker-header");
        this.color_square = document.getElementById("color-square");
        this.ctx = this.color_square.getContext("2d");
        this.color_slider = new Slider("square", "color-slider", 255, 255, 255);
        this.hue_slider = new Slider("vertical", "hue-slider", 10, 256, 360)
        this.hue_input = new Button_Slider("hue", "H", 65, 360, 3, "number", 360);
        this.saturation_input = new Button_Slider("saturation", "S", 65, 0, 3, "number", 100);
        this.lightness_input = new Button_Slider("lightness", "L", 65, 100, 3, "number", 100);
        this.alpha_input = new Button_Slider("alpha", "A", 65, 255, 3, "number", 255);
        this.red_input = new Button_Slider("red", "R", 65, 255, 3, "number", 255);
        this.green_input = new Button_Slider("green", "G", 65, 255, 3, "number", 255);
        this.blue_input = new Button_Slider("blue", "B", 65, 255, 3, "number", 255);
        this.hex_input = new Button_Slider("hex", "Hex", 70, "ffffff", 6, "hex", 255);
        this.new_color_rect = document.getElementById("new-color-rect");
        this.old_color_rect = document.getElementById("old-color-rect");

        this.current_hue = 360;
        this.current_saturation = 0;
        this.current_lightness = 100;
        this.current_alpha = 1;
        this.current_rgb = [255, 255, 255];
        this.current_color = "white";
        this.new_color = this.current_color;
        this.old_color = this.current_rgb;
        this.old_alpha = this.current_alpha
        
        this.init();
    }

    init(){
        this.new_color_rect.style.backgroundColor = this.current_color;
        this.old_color_rect.style.backgroundColor = this.current_color;
        this.color_square.width = 256;
        this.color_square.height = 256;
        this.hue_slider.selector.style.backgroundColor = "hsl(0, 100%, 50%)";
        this.color_slider.selector.style.backgroundColor = "white";
        this.hue_slider.value = this.current_hue;
        this.hue_slider.update_position()
        this.hue_input.slider.value = this.hue_input.slider.height;
        this.lightness_input.slider.value = this.current_lightness;
        this.red_input.slider.value = Math.round(this.current_rgb[0] * 100 / 255);
        this.green_input.slider.value = Math.round(this.current_rgb[1] * 100 / 255);
        this.blue_input.slider.value = Math.round(this.current_rgb[2] * 100 / 255);
        this.alpha_input.slider.value = this.alpha_input.slider.height;
        this.draw_color_square(0);

        document.getElementById("color-picker-cancel").onclick = this.cancel(this);
        document.getElementById("color-picker-ok").onclick = this.ok(this);
    }

    draw_color_square(hue){
        for(var row=0; row<256; row++){
            var grad = this.ctx.createLinearGradient(1, 1, 256,1);
            grad.addColorStop(0, 'hsl('+hue+', 0%, '+(100- row * 100 / 256)+'%)');
            grad.addColorStop(1, 'hsl('+hue+', 100%, '+(100-row * 100 / 256)+'%)');
            this.ctx.fillStyle=grad;
            this.ctx.fillRect(0, row, 256, 1);
        }
    }

    cancel(owner){
        return function(){
            owner.toggle_display();
            owner.update_color("cancel")
        }
    }

    ok(owner){
        return function(){
            owner.old_color = owner.current_rgb;
            owner.toggle_display();
            owner.old_color_rect.style.backgroundColor = owner.current_color;
        }
    }

    toggle_display(){
        if(getComputedStyle(this.window, null).display == "grid"){
            this.window.style.display = "none";
        } else {
            this.window.style.display = "grid";
        }
    }

    update_color(origin){
        if(origin == "hue-slider"){
            this.current_hue = Math.round(this.hue_slider.value * 360/256);
        } else if (origin == "hue"){
            this.current_hue = this.hue_input.input.value;
        } else if (origin == "hue-input-slider"){
            this.current_hue = this.hue_input.slider_to_input();
        } else if (origin == "color-slider"){
            this.current_saturation = Math.round(this.color_slider.value[0] * 100 / 256);
            this.current_lightness = 100 - Math.round(this.color_slider.value[1] * 100 / 256);
        } else if (origin == "saturation-input-slider"){
            this.current_saturation = this.saturation_input.slider.value;
        } else if (origin == "saturation"){
            this.current_saturation = this.saturation_input.input.value;
        } else if (origin == "lightness-input-slider"){
            this.current_lightness = this.lightness_input.slider.value;
        } else if (origin == "lightness"){
            this.current_lightness = this.lightness_input.input.value;
        } 

        this.current_rgb = hsl_to_rgb(this.current_hue, this.current_saturation, this.current_lightness);
        
        if (origin == "alpha-input-slider"){
            this.current_alpha = this.alpha_input.slider.value / 100;
        } else if (origin == "alpha"){
            this.current_alpha = this.alpha_input.input_to_slider() / 100;
        } else if (origin == "red-input-slider" || origin == "green-input-slider" || origin == "blue-input-slider"){
            this.current_rgb = [this.red_input.slider_to_input(), this.green_input.slider_to_input(), this.blue_input.slider_to_input()]
            var HSL = rgb_to_hsl(this.current_rgb);
            this.current_hue = Math.round(HSL[0]);
            this.current_saturation = Math.round(HSL[1]);
            this.current_lightness = Math.round(HSL[2]);
        } else if (origin == "red" | origin == "green" || origin == "blue"){
            this.current_rgb = [this.red_input.input.value, this.green_input.input.value, this.blue_input.input.value];
            var HSL = rgb_to_hsl(this.current_rgb);
            this.current_hue = Math.round(HSL[0]);
            this.current_saturation = Math.round(HSL[1]);
            this.current_lightness = Math.round(HSL[2]);
            this.current_alpha = this.old_alpha;
        } 
        
        this.new_color = this.current_color;
        if (origin == "cancel"){
            this.new_color = this.old_color;
            this.current_rgb = this.old_color;
            var HSL = rgb_to_hsl(this.current_rgb);
            this.current_hue = Math.round(HSL[0]);
            this.current_saturation = Math.round(HSL[1]);
            this.current_lightness = Math.round(HSL[2]);
            this.current_alpha = this.old_alpha;
        }
        
        var HEX = rgb_to_hex(this.current_rgb)
        if (origin == "hex"){
            HEX = this.hex_input.input.value;
            this.current_rgb = hex_to_rgb(this.hex_input.input.value);
            var HSL = rgb_to_hsl(this.current_rgb)
            this.current_hue = Math.round(HSL[0]);
            this.current_saturation = Math.round(HSL[1]);
            this.current_lightness = Math.round(HSL[2]);
            this.current_alpha = this.old_alpha;
        }

        this.current_color = hsla(this.current_hue, this.current_saturation, this.current_lightness, this.current_alpha);
        var hue_color = hsl(this.current_hue, 100, 50);

        this.hue_input.input.value = this.current_hue;
        this.hue_input.slider.value = this.hue_input.input_to_slider();
        this.hue_slider.update_position(360 - this.current_hue);
        this.color_slider.update_position(256 - this.current_lightness * 255 / 100, this.current_saturation  * 256 / 100);
        this.saturation_input.input.value = this.current_saturation;
        this.saturation_input.slider.value = this.current_saturation;
        this.lightness_input.input.value = this.current_lightness;
        this.lightness_input.slider.value = this.current_lightness;
        this.red_input.input.value = this.current_rgb[0];
        this.red_input.slider.value = this.red_input.input_to_slider();
        this.green_input.input.value = this.current_rgb[1];
        this.green_input.slider.value = this.green_input.input_to_slider();
        this.blue_input.input.value = this.current_rgb[2];
        this.blue_input.slider.value = this.blue_input.input_to_slider();
        this.alpha_input.input.value = Math.floor(this.current_alpha * 255);
        this.alpha_input.slider.value = this.alpha_input.input_to_slider();
        this.hex_input.input.value = HEX;

        this.hue_slider.selector.style.backgroundColor = hue_color;
        this.color_slider.selector.style.backgroundColor = this.current_color;
        state.mouse_indicator.style.backgroundColor = this.current_color;
        this.new_color_rect.style.backgroundColor = this.current_color;

        this.draw_color_square(this.current_hue);
    }
    
}

class Slider{
    constructor(type, name, w, h, max_value){
        this.name = name;
        this.type = type;
        this.height = h;
        this.width = w;
        this.max_value = max_value
        if(type == "square"){
            this.value = [0, 0];
        } else {
            this.value = 0
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
        this.zoom = 500;
        this.w = w;
        this.h = h;
        this.draw_size = this.zoom / this.w;
        this.draw_buffer = []
        this.init();
    }

    init(){
        for(var x = 0; x < this.w; x++){
            this.data.push([]);
            for(var y = 0; y < this.h; y++){
                this.data[x].push(new Pixel_Data());
            }
        }
    }

    draw_data(){
        for(var x = 0; x < this.w; x++){
            for(var y = 0; y < this.h; y++){
                if(this.data[x][y].filled == true){
                    this.draw_pixel(this.data[x][y].color, x * this.draw_size, y * this.draw_size);
                }
            }
        }
    }

    draw_pixel(color, x, y){
        this.ctx.beginPath();
        this.ctx.rect(x, y, Math.ceil(this.draw_size), Math.ceil(this.draw_size));
        this.ctx.fillStyle = color;
        this.ctx.fill();
        if (this.contains(x, y)){
            this.data[x][y].filled = true;   
        }
    }

    erase_pixel(x, y){
        this.ctx.clearRect(x * this.draw_size, y * this.draw_size, Math.ceil(this.draw_size), Math.ceil(this.draw_size));
        this.data[x][y].filled = false;
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
                    this.ctx.rect(x0 * this.draw_size, y0 * this.draw_size, Math.ceil(this.draw_size), Math.ceil(this.draw_size));
                    this.data[x0][y0].filled = true;
                    this.data[x0][y0].color = state.color_picker.current_color;
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

class Pixel_Data{
    constructor(){
        this.color = [0, 0, 0];
        this.filled = false;
    }
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
            if(input_elem.value.length == 0){
                input_elem.value = "000000"
            } else if (input_elem.value.length == 1){
                input_elem.value = "00000" + input_elem.value;
            } else if (input_elem.value.length == 2){
                input_elem.value = "0000" + input_elem.value;
            } else if (input_elem.value.length == 3) {
                input_elem.value = input_elem.value[0] + input_elem.value[0] + input_elem.value[1] + input_elem.value[1] + input_elem.value[2] + input_elem.value[2] 
            } else if (input_elem.value.length == 4) {
                input_elem.value = "00" + input_elem.value;
            } else if (input_elem.value.length == 5) {
                input_elem.value = "0" + input_elem.value;
            }
            state.color_picker.update_color(owner.name);
        }
    }
}