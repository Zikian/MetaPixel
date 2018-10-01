class Slider{
    constructor(type, id, size, max_val, input_function){
        this.wrapper = document.getElementById(id);
        
        this.wrapper.className = type + "-slider";
        this.selector = this.wrapper.getElementsByClassName("slider-selector")[0];
        
        this.type = type;
        this.size = size;
        this.max_val = max_val;
        this.input_function = input_function;
        
        if(type == "vertical"){
            this.wrapper.style.height = size + "px";
            this.selector.style.top = "-10px";
            this.selector.style.left = "-5px";
            this.value = 0;
        } else if (type == "square"){
            this.wrapper.style.height = size + "px";
            this.wrapper.style.width = size + "px";
            this.selector.style.top = "-10px";
            this.selector.style.left ="-10px";
            this.value = [0, 0]
        }

        this.add_events(this);
        this.i = 0;
    }

    add_events(owner){
        this.selector.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.selector;
            owner.update_slider();
            owner.input_function();
        }
        this.wrapper.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.selector;
            owner.update_slider();
            owner.input_function();
        }
        this.selector.mousedrag_actions = function(){
            owner.update_slider();
            owner.input_function();
        }
    }
  
    update_position(value_y, value_x = null){
        if(this.type == "vertical"){
            this.selector.style.top = -10 + value_y * this.size / this.max_val + "px";
        } else if (this.type == "square"){
            this.selector.style.top = -10 + value_y * this.size / this.max_val + "px";
            this.selector.style.left = -10 + value_x * this.size / this.max_val + "px";
            this.value[0] = this.selector.offsetLeft + 10;
            this.value[1] = this.selector.offsetTop + 10;
        }
    }
    
    update_slider(){
        if(this.type == "vertical"){
            this.selector.style.top = clamp(event.clientY - this.wrapper.getBoundingClientRect().y - 10, -10, this.size - 10) + "px";
            this.value = this.size - (this.selector.offsetTop + 10);
        } else if (this.type == "square"){
            this.selector.style.left = clamp(event.clientX - this.wrapper.getBoundingClientRect().x - 10, -10, this.size - 10) + "px";
            this.selector.style.top = clamp(event.clientY - this.wrapper.getBoundingClientRect().y - 10, -10, this.size - 10) + "px";
            this.value[0] = this.selector.offsetLeft + 10;
            this.value[1] = this.selector.offsetTop + 10;
        }
    }
}

class Input{
    constructor(type, id, name, w, default_val, max_length, input_function){
        this.wrapper = document.getElementById(id);
        this.name_elem = this.wrapper.getElementsByClassName("input-name")[0];
        this.input = this.wrapper.getElementsByTagName("INPUT")[0];

        this.name_elem.innerHTML = name + ":";
        this.input.maxLength = max_length;
        this.input.value = default_val;
        this.input.style.width = w + "px";

        if(type == "hexadecimal"){
            this.input.onchange = this.hex_onchange(this);
            this.input.oninput = function(){
                this.value = this.value.replace(/([^a-f0-9A-F])/g, '')
            };
        } else {
            this.input.oninput = function(){
                if(this.value < 0){
                    this.value = 0;
                }
                input_function();
            }
        }

        this.input_function = input_function;
    }

    hex_onchange(owner){
        return function(){
            var value = owner.input.value
            switch (value.length){
                case 0:
                    value = "000000"
                    break;
                case 1:
                    value = "00000" + value;
                    break;
                case 2:
                    value = "0000" + value;
                    break;
                case 3:
                    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2] 
                    break;
                case 4:
                    value = "00" + this.value;
                    break;
                case 5:
                    value = "0" + this.value;
                    break
                }
            owner.input.value = value
            owner.input_function();
        }
    }
}

class Input_Slider{
    constructor(id, name, default_val, max_val, input_function){
        this.max_val = max_val;
        this.input_function = input_function;

        this.wrapper = document.getElementById(id);
        this.input = this.wrapper.getElementsByTagName("INPUT")[0];
        this.caret = this.wrapper.getElementsByTagName("I")[0];
        this.name_elem = this.wrapper.getElementsByClassName("input-slider-name")[0];
        this.slider = this.wrapper.getElementsByClassName("input-slider-slider")[0];
        this.selector = this.wrapper.getElementsByClassName("input-slider-selector")[0];
        
        if(name.length > 0) { this.name_elem.innerHTML = name + ":"; }
        this.input.value = default_val;
        this.input.min = 0;
        this.input.oninput = this.oninput(this);
        this.input.onkeydown = function(){
            if(event.keyCode == 189 || event.keyCode == 187){ return false; }
        }
        
        this.add_events(this);
    }

    add_events(owner){
        this.caret.onmousedown = function(e){
            pauseEvent(e);
            state.active_element = owner.selector;
            var mouse_offset = event.clientY - owner.wrapper.getBoundingClientRect().y;
            owner.slider.style.top = mouse_offset - 100 + owner.input_to_slider(owner.input.value) + "px";
            owner.update_slider();
            owner.slider.style.display = "block";
        }
        this.selector.mousedrag_actions = function(){
            owner.update_slider();
            owner.input_function();
        }
        window.addEventListener("mouseup", function(){
            if(state.active_element == owner.selector){
                owner.slider.style.display = "none";
            }
        })
    }
    
    update_slider(){
        var offset = clamp(event.clientY - this.slider.getBoundingClientRect().y - 5, -5, 95);
        this.selector.style.top = offset + "px";
        this.slider.value = offset + 5;
        this.input.value = this.max_val - this.slider_to_input(this.slider.value);
    }
    
    input_to_slider(val){
        return Math.round(val * 100 / this.max_val);
    }
    
    slider_to_input(val){
        return Math.round(val * this.max_val / 100);
    }
    
    oninput(owner){
    	return function(){
            var leading_zero = /^0[0-9].*$/;
            if(leading_zero.test(this.value)){
              this.value = parseInt(this.value, 10);
            } else if (this.value > owner.max_val){
								this.value = 255;
            } else if (this.value.length == 0){
                this.value = 0;
            }
            owner.input_function();
        }
    }
}