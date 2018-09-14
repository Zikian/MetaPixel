class Color_Picker{
    constructor(){
        this.window = document.getElementById("color-picker");
        
        this.header = document.getElementById("color-picker-header");
        this.header.onmousedown = set_active_element;
        this.header.active_func = function(){
            drag_element(state.color_picker.window,  state.delta_mouse);
            state.color_picker.window.style.top = clamp(state.color_picker.window.offsetTop, state.canvas_area.getBoundingClientRect().y, window.innerHeight) + "px";
        }
        this.header_text = document.getElementById("color-picker-header-text");
        
        document.getElementById("color-picker-cancel").onclick = this.cancel(this);
        document.getElementById("color-picker-ok").onclick = this.ok(this);
        
        this.color_square = document.getElementById("color-square");
        this.ctx = this.color_square.getContext("2d");

        this.new_color_rect = document.getElementById("new-color-rect");
        this.old_color_rect = document.getElementById("old-color-rect");
        
        var input_function = null;
        
        input_function = function(){ state.color_picker.update_color("color-slider")}
        this.color_slider = new Slider("square", "color-slider", 255, 255, input_function);
        
        input_function = function(){ state.color_picker.update_color("hue-slider"); }
        this.hue_slider = new Slider("vertical", "hue-slider", 256, 360, input_function);
        
        input_function = function(){ state.color_picker.update_color("hue-input"); }
        this.hue_input = new Input_Slider("hue-input", "H", 360, 360, input_function);
        
        input_function = function(){ state.color_picker.update_color("saturation-input"); }
        this.saturation_input = new Input_Slider("saturation-input", "S", 0, 100, input_function);
        
        input_function = function(){ state.color_picker.update_color("lightness-input"); }
        this.lightness_input = new Input_Slider("lightness-input", "L", 0, 100, input_function);
        
        input_function = function(){ state.color_picker.update_color("alpha-input"); }
        this.alpha_input = new Input_Slider("alpha-input", "A", 255, 255, input_function);
        
        input_function = function(){ state.color_picker.update_color("red-input"); }
        this.red_input = new Input_Slider("red-input", "R", 0, 255, input_function);
        
        input_function = function(){ state.color_picker.update_color("green-input"); }
        this.green_input = new Input_Slider("green-input", "G", 0, 255, input_function);
        
        input_function = function(){ state.color_picker.update_color("blue-input"); }
        this.blue_input = new Input_Slider("blue-input", "B", 0, 255, input_function);
        
        input_function = function(){ state.color_picker.update_color("hex-input"); }
        this.hex_input = new Input("hexadecimal", "hex-input", "Hex", 75, "000000", 6, input_function);
        
        this.reset_vars();

        this.new_color_rect.style.backgroundColor = this.color;
        this.old_color_rect.style.backgroundColor = this.color;
        document.getElementById("primary-color-rect").style.backgroundColor = this.color;
        document.getElementById("secondary-color-rect").style.backgroundColor = "white";

        this.update_color();
    }

    reset_vars(){
        this.hue = 360;
        this.saturation = 0;
        this.lightness = 0;
        this.alpha = 1;
        this.rgb = [0, 0, 0];
        this.rgba = [0, 0, 0, 255];
        this.primary_color = [0, 0, 0, 255];
        this.secondary_color = [255, 255, 255, 255];
        this.color = "black";
        this.selected_color = "primary";
        this.old_color = this.rgb;
        this.old_alpha = this.alpha
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
            owner.old_color = owner.rgb;
            owner.toggle_display();
            owner.old_color_rect.style.backgroundColor = owner.color;
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
        switch (origin){
            case "hue-slider":
                this.update_from_hue(Math.round(this.hue_slider.value * 360/256));
                break;
            case "hue-input":
                this.update_from_hue(this.hue_input.input.value);
                break;
            case "color-slider":
                this.update_from_sl(Math.round(this.color_slider.value[0] * 100 / 256), 100 - Math.round(this.color_slider.value[1] * 100 / 256))
                break;
            case "saturation-input": // FALLTHROUGH
            case "lightness-input":
                this.update_from_sl(this.saturation_input.input.value, this.lightness_input.input.value);
                break;
            case "alpha-input":
                this.alpha = this.alpha_input.input.value / 255;
                this.rgba = this.rgb.concat(this.alpha);
                break;
            case "tool-options-opacity":
                this.alpha = state.tool_options.opacity_input.input.value / 255;
                this.rgba = this.rgb.concat(this.alpha);
                break;
            case "red-input":
            case "green-input":
            case "blue-input":
                this.update_from_rgb(this.red_input.input.value, this.green_input.input.value, this.blue_input.input.value)
                break;
            case "cancel":
                this.rgb = this.old_color;
                this.update_from_rgb(...this.rgb)
                this.alpha = this.old_alpha;
                break;
            case "hex-input":
                this.update_from_rgb(...hex_to_rgb(this.hex_input.input.value));
                break;
            case "eyedropper":
                if(!state.main_canvas.contains_mouse()){ return; }
                var color = state.eyedropper_ctx.getImageData(state.pixel_pos[0], state.pixel_pos[1], 1, 1).data
                this.update_from_rgba(Array.prototype.slice.call(color));
                break;
            case "switch-colors":
                var new_primary_color = this.secondary_color;
                this.secondary_color = this.primary_color;
                this.primary_color = new_primary_color;
                this.update_from_rgba(this.primary_color);
                break;
            case "reset-colors":
                this.reset_vars();
                break;
            case "to-background":
                this.update_from_rgba(this.secondary_color);
                break;
            case "to-foreground":
                this.update_from_rgba(this.primary_color)
                break;
            case "palette":
                this.update_from_rgb(...state.palette.current_color.color);
                break;
            }
            
        this.color = hsla(this.hue, this.saturation, this.lightness, this.alpha);
        
        if(this.selected_color == "primary"){
            this.header_text.innerHTML = "Color Picker (Foreground)"
            this.primary_color = this.rgba;
        } else {
            if(this.selected_color == "secondary"){
                this.header_text.innerHTML = "Color Picker (Background)"
                this.secondary_color = this.rgba;
            }
        }

        this.color_slider.selector.style.backgroundColor = this.color;
        state.mouse_indicator.style.backgroundColor = this.color;
        this.new_color_rect.style.backgroundColor = this.color;
        this.hue_slider.selector.style.backgroundColor = hsl(this.hue, 100, 50);
        document.getElementById("primary-color-rect").style.backgroundColor = rgba(this.primary_color);
        document.getElementById("secondary-color-rect").style.backgroundColor = rgba(this.secondary_color);
        
        
        this.red_input.input.value = this.rgb[0];
        this.green_input.input.value = this.rgb[1];
        this.blue_input.input.value = this.rgb[2];
        this.hue_input.input.value = this.hue;
        this.saturation_input.input.value = this.saturation;
        this.lightness_input.input.value = this.lightness;
        this.alpha_input.input.value = Math.floor(this.alpha * 255);
        this.hex_input.input.value = rgb_to_hex(this.rgb);
        
        this.draw_color_square(this.hue);

        if(origin != "color-slider" && origin != "hue-slider"){
            this.color_slider.update_position(256 - this.lightness * 255 / 100, this.saturation  * 256 / 100);
            this.hue_slider.update_position(360 - this.hue);
        }
    }

    update_from_hue(hue){
        this.hue = hue;
        this.rgb = hsl_to_rgb(hue, this.saturation, this.lightness);
        this.rgba = this.rgb.concat(this.alpha * 255)
        this.color = hsla(this.hue, this.saturation, this.lightness, this.alpha);
    }

    update_from_sl(saturation, lightness){
        this.saturation = saturation;
        this.lightness = lightness;
        this.rgb = hsl_to_rgb(this.hue, saturation, lightness);
        this.rgba = this.rgb.concat(this.alpha * 255)
        this.color = hsla(this.hue, this.saturation, this.lightness, this.alpha);
    }

    update_from_rgb(r, g, b){
        this.rgb = [r, g, b];
        this.rgba = this.rgb.concat(this.alpha * 255);
        this.update_hsl_from_rgb(this.rgb);
    }

    update_hsl_from_rgb(rgb){
        var HSL = rgb_to_hsl(rgb)
        this.hue = Math.round(HSL[0]);
        this.saturation = Math.round(HSL[1]);
        this.lightness = Math.round(HSL[2]);
    }

    update_from_rgba(rgba){
        this.rgba = rgba;
        this.rgb = rgba.slice(0, 3);
        this.update_hsl_from_rgb(this.rgb);
        this.alpha = rgba[3] / 255;
    }
}
