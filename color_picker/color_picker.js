class Color_Picker{
    constructor(){
        this.selected_slider = null;
        this.position = [0, 0];
        this.window = document.getElementById("color-picker");
        this.header = document.getElementById("color-picker-header");
        this.header_text = document.getElementById("color-picker-header-text");
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

        this.init_color_vars();        
        this.init();
    }

    init_color_vars(){
        this.current_hue = 360;
        this.current_saturation = 0;
        this.current_lightness = 0;
        this.current_alpha = 1;
        this.current_rgb = [0, 0, 0];
        this.current_rgba = [0, 0, 0, 255]
        this.primary_color = [0, 0, 0, 1];
        this.secondary_color = [255, 255, 255, 1];
        this.current_color = "black";
        this.selected_color = "primary";
        this.new_color = this.current_color;
        this.old_color = this.current_rgb;
        this.old_alpha = this.current_alpha
    }

    init(){
        this.new_color_rect.style.backgroundColor = this.current_color;
        this.old_color_rect.style.backgroundColor = this.current_color;
        this.color_square.width = 256;
        this.color_square.height = 256;
        this.hue_slider.selector.style.backgroundColor = "hsl(0, 100%, 50%)";
        this.color_slider.selector.style.backgroundColor = "black";
        document.getElementById("primary-color-rect").style.backgroundColor = this.current_color;
        document.getElementById("secondary-color-rect").style.backgroundColor = "white";
        this.hue_slider.value = this.current_hue;
        this.hue_slider.update_position()
        this.hue_input.slider.value = this.hue_input.slider.height;
        this.lightness_input.slider.value = this.current_lightness;
        this.red_input.slider.value = Math.round(this.current_rgb[0] * 100 / 255);
        this.green_input.slider.value = Math.round(this.current_rgb[1] * 100 / 255);
        this.blue_input.slider.value = Math.round(this.current_rgb[2] * 100 / 255);
        this.alpha_input.slider.value = this.alpha_input.slider.height;
        this.draw_color_square(this.current_hue);

        document.getElementById("color-picker-cancel").onclick = this.cancel(this);
        document.getElementById("color-picker-ok").onclick = this.ok(this);

        this.header.onmousedown = function(){
            state.active_element = state.color_picker.header;
        }
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
        switch (origin){
            case "hue-slider":
                this.current_hue = Math.round(this.hue_slider.value * 360/256);
                break;
            case "hue":
                this.current_hue = this.hue_input.input.value;
                break;
            case "hue-input-slider":
                this.current_hue = this.hue_input.slider_to_input();
                break;
            case "color-slider":
                this.current_saturation = Math.round(this.color_slider.value[0] * 100 / 256);
                this.current_lightness = 100 - Math.round(this.color_slider.value[1] * 100 / 256);
                break;
            case "saturation-input-slider":
                this.current_saturation = this.saturation_input.slider.value;
                break;
            case "saturation":
                this.current_saturation = this.saturation_input.input.value;
                break;
            case "lightness-input-slider":
                this.current_lightness = this.lightness_input.slider.value;
                break;
            case "lightness":
                this.current_lightness = this.lightness_input.input.value;
                break;
            case "alpha-input-slider":
                this.current_alpha = this.alpha_input.slider.value / 100;
                break;
            case "alpha":
                this.current_alpha = this.alpha_input.input.value / 255;
                break;
            case "red-input-slider":    // Fallthrough
            case "green-input-slider":
            case "blue-input-slider":
                this.current_rgb = [this.red_input.slider_to_input(), this.green_input.slider_to_input(), this.blue_input.slider_to_input()]
                this.current_alpha = this.alpha_input.input_to_slider() / 100;
                break;
            case "red":    // Fallthrough
            case "green":
            case "blue":
                this.current_rgb = [this.red_input.input.value, this.green_input.input.value, this.blue_input.input.value];
                this.current_alpha = this.alpha_input.input_to_slider() / 100;
                break;
            case "cancel":
                this.new_color = this.old_color;
                this.current_rgb = this.old_color;
                this.current_alpha = this.old_alpha;
                break;
            case "hex":
                this.current_rgb = hex_to_rgb(this.hex_input.input.value);
                this.current_alpha = this.alpha_input.input_to_slider() / 100;
                break;
            case "eyedropper":
                this.current_color = state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].color;
                this.current_rgba = state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].rgba
                this.update_from_rgba(this.current_rgba);
                break;
            case "switch-colors":
                var new_primary_color = this.secondary_color;
                this.secondary_color = this.primary_color;
                this.primary_color = new_primary_color;
                this.current_rgba = this.primary_color;
                this.update_from_rgba(this.current_rgba);
                break;
            case "reset-colors":
                this.init_color_vars();
                break;
            case "to-background":
                this.current_rgba = this.secondary_color;
                this.update_from_rgba(this.current_rgba);
                break;
            case "to-foreground":
                this.current_rgba = this.primary_color;
                this.update_from_rgba(this.current_rgba);
                break;
        }

        this.new_color = this.current_color;
        this.current_rgb = hsl_to_rgb(this.current_hue, this.current_saturation, this.current_lightness);
        this.current_rgba = [this.current_rgb[0], this.current_rgb[1], this.current_rgb[2], this.current_alpha];

        this.current_color = hsla(this.current_hue, this.current_saturation, this.current_lightness, this.current_alpha);
        
        if(this.selected_color == "primary"){
            this.header_text.innerHTML = "Color Picker (Foreground)"
            this.primary_color = this.current_rgba;
        } else {
            if(origin != "switch-colors"){
                this.header_text.innerHTML = "Color Picker (Background)"
                this.secondary_color = this.current_rgba;
            }
        }

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
        this.hex_input.input.value = rgb_to_hex(this.current_rgb);

        this.hue_slider.selector.style.backgroundColor = hsl(this.current_hue, 100, 50);
        this.color_slider.selector.style.backgroundColor = this.current_color;
        state.mouse_indicator.style.backgroundColor = this.current_color;
        this.new_color_rect.style.backgroundColor = this.current_color;

        document.getElementById("primary-color-rect").style.backgroundColor = rgba(this.primary_color);
        document.getElementById("secondary-color-rect").style.backgroundColor = rgba(this.secondary_color);

        this.draw_color_square(this.current_hue);
    }

    update_hsl_from_rgb(rgb){
        var HSL = rgb_to_hsl(rgb)
        this.current_hue = Math.round(HSL[0]);
        this.current_saturation = Math.round(HSL[1]);
        this.current_lightness = Math.round(HSL[2]);
    }

    update_from_rgba(rgba){
        this.current_rgb = rgba.slice(0, 3);
        this.update_hsl_from_rgb(this.current_rgb);
        this.current_alpha = rgba[3];
    }
}
