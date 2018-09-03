class Layer_Settings{
    constructor(){
        this.target = null;
        this.prev_opacity = null;

        this.wrapper = document.getElementById("layer-settings")
        this.header = document.getElementById("layer-settings-header");
        this.name_input = document.getElementById("layer-name-setting")

        var input_function = function(){
            state.layer_settings.target.opacity = state.layer_settings.opacity_input.input.value / 255;
            state.layer_settings.target.redraw();
        }
        this.opacity_input = new Input_Slider("opacity-setting", "Opacity", 255, 255, input_function);
        this.ok_button = document.getElementById("layer-settings-ok");
        this.cancel_button = document.getElementById("layer-settings-cancel");
        document.getElementById("layer-settings-cross").onclick = this.cancel(this);

        this.ok_button.onclick = this.validate(this);
        this.cancel_button.onclick = this.cancel(this);
        this.header.onmousedown = function(){
            state.active_element = this;
        }
    }

    open(target){
        this.target = target;
        this.name_input.value = this.target.name_elem.innerHTML;
        this.opacity_input.input.value = this.target.opacity * 255;
        this.prev_opacity = this.target.opacity;
        this.wrapper.style.display = "block";
    }

    validate(owner){
        return function(){
            var prev_settings = {
                opacity: owner.target.opacity,
                name: owner.target.name_elem.innerHTML
            };

            if(owner.name_input.value.length != 0){
                owner.target.name_elem.innerHTML = owner.name_input.value;
            }
            owner.wrapper.style.display = "none"

            var new_settings = {
                opacity: owner.target.opacity,
                name: owner.target.name_elem.innerHTML
            };

            if(prev_settings.opacity == new_settings.opacity && prev_settings.name == new_settings.name){ return; }
            state.history_manager.add_history("layer-settings", [prev_settings, new_settings, owner.target]);
        }
    }

    cancel(owner){
        return function(){
            owner.wrapper.style.display = "none"
            owner.target.opacity = owner.prev_opacity;
            owner.target.redraw();
        }
    }
}