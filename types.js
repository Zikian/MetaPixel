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