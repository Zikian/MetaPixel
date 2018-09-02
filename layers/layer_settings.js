class Layer_Settings{
    constructor(){
        this.target = null;

        this.wrapper = document.getElementById("layer-settings")
        this.name_input = document.getElementById("layer-name-setting")
        this.opacity_input = new Input_Slider("opacity-setting", "Opacity", 255, 255, function(){});
        this.ok_button = document.getElementById("layer-settings-ok");
        this.cancel_button = document.getElementById("layer-settings-cancel");
        document.getElementById("layer-settings-cross").onclick = this.cancel(this);

        this.ok_button.onclick = this.validate(this);
        this.cancel_button.onclick = this.cancel(this);
    }

    open(target){
        this.target = target;
        this.name_input.value = this.target.name_elem.innerHTML;
        this.opacity_input.input.value = this.target.opacity;
        this.wrapper.style.display = "block";
    }

    validate(owner){
        return function(){
            owner.target.opacity = owner.opacity_input.input.value;
            if(owner.name_input.value.length != 0){
                owner.target.name_elem.innerHTML = owner.name_input.value;
            }
            owner.wrapper.style.display = "none"
        }
    }

    cancel(owner){
        return function(){
            owner.wrapper.style.display = "none"
        }
    }
}