class New_Document_Panel{
    constructor(){
        this.panel = document.getElementById("new-document-panel");
        this.header = document.getElementById("new-document-header");

        this.new_button = document.getElementById("new-button");
        this.exit_cross = document.getElementById("new-document-cross")
        this.ok_button = document.getElementById("new-document-ok");
        this.cancel_button = document.getElementById("new-document-cancel");


        this.name_error = document.getElementById("name-error");
        this.name_input = document.getElementById("name-input");
        this.width_input = document.getElementById("width-input");
        this.height_input = document.getElementById("height-input");
        this.transparency_input = document.getElementById("transparency-input");

        this.new_button.onclick = this.show_panel(this);
        this.exit_cross.onclick = this.hide_panel(this)
        this.ok_button.onclick = this.submit(this);
        this.cancel_button.onclick = this.hide_panel(this);

        this.height_input.oninput = this.input_validation();
        this.width_input.oninput = this.input_validation();
        this.height_input.onchange = this.onchange_validation();
        this.width_input.onchange = this.onchange_validation();

        this.header.onmousedown = function(){ state.active_element = document.getElementById("new-document-header"); };

        this.panel.style.left = (window.innerWidth - this.panel.clientWidth)/2 - 150 + "px";
        this.panel.style.top = (window.innerHeight - 400)/2 + "px";
    }

    input_validation(){
        return function(){
            var leading_zero = /^0[0-9].*$/;
            if(leading_zero.test(this.value)){
                this.value = parseInt(this.value, 10);
            }
            if (this.value > 700){
                this.value = 700;
            }
            if (this.value < 0){
                this.value = 0;
            }
        }
    }

    onchange_validation(){
        return function(){
            if (this.value.length == 0){
                this.value = 0
            }
        }
    }

    show_panel(owner){
        return function(){ owner.panel.style.display = "block"; }
    }

    hide_panel(owner){
        return function(){ owner.panel.style.display = "none"; }
    }

    submit(owner){
        return function(){
            if (owner.name_input.value.length == 0){
                owner.name_input.value = "Untitled";
            }

            state.document_name = owner.name_input.value;
            state.transparency = owner.transparency_input.checked;
            if (state.main_canvas.canvas_width != 0 && state.main_canvas.canvas_height != 0){
                state.main_canvas = new Canvas(canvas, owner.width_input.value, owner.height_input.value);
                setup();
            }
            
            owner.panel.style.display = "none";
        }
    }
}