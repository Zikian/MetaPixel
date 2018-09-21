class New_Document_Panel{
    constructor(){
        this.document_type = "single-image"

        this.panel = document.getElementById("new-document-panel");
        this.header = document.getElementById("new-document-header");

        this.new_button = document.getElementById("new-button");
        this.exit_cross = document.getElementById("new-document-cross")
        this.ok_button = document.getElementById("new-document-ok");
        this.cancel_button = document.getElementById("new-document-cancel");

        this.name_error = document.getElementById("name-error");
        this.name_input = document.getElementById("name-input");

        this.document_width_wrapper = document.getElementById("document-width-wrapper");
        this.width_input = document.getElementById("document-width-input");

        this.document_height_wrapper = document.getElementById("document-height-wrapper");
        this.height_input = document.getElementById("document-height-input");

        this.tile_width_wrapper = document.getElementById("tile-width-wrapper");
        this.tile_width_input = document.getElementById("tile-width");
        
        this.tile_height_wrapper = document.getElementById("tile-height-wrapper");
        this.tile_height_input = document.getElementById("tile-height");

        this.transparency_input = document.getElementById("transparency-input");

        this.new_button.onclick = this.show_panel(this);
        this.exit_cross.onclick = this.hide_panel(this)
        this.ok_button.onclick = this.submit(this);
        this.cancel_button.onclick = this.hide_panel(this);

        this.width_input.oninput = function(){
            state.new_document_panel.input_validation(this);
            if(state.new_document_panel.document_type = "tiled"){
                var tile_width = state.new_document_panel.tile_width_input.value;
                var total_width = this.value * tile_width;
                if (total_width > 700){
                    this.value = Math.floor(700 / tile_width);
                }
            }
        }
        this.width_input.onchange = this.onchange_validation();

        this.height_input.oninput = function(){
            state.new_document_panel.input_validation(this);
            if(state.new_document_panel.document_type = "tiled"){
                var tile_height = state.new_document_panel.tile_height_input.value;
                var total_height = this.value * tile_height;
                if (total_height > 700){
                    this.value = Math.floor(700 / tile_height);
                }
            }
        }
        this.height_input.onchange = this.onchange_validation();

        this.tile_width_input.oninput = function(){ state.new_document_panel.input_validation(this); }
        this.tile_height_input.oninput = function(){ state.new_document_panel.input_validation(this); }

        this.header.onmousedown = set_active_element;
        this.header.mousedrag_actions =  function(){ drag_element(state.new_document_panel.panel, state.delta_mouse); }

        this.panel.style.left = (window.innerWidth - this.panel.clientWidth)/2 - 150 + "px";
        this.panel.style.top = (window.innerHeight - 400)/2 + "px";

        this.single_image_button = document.getElementById("single-image-document");
        this.single_image_button.onclick = function(){
            state.new_document_panel.switch_document_type(this)
        }   
        
        this.tiled_document_button = document.getElementById("tiled-document");
        this.tiled_document_button.style.backgroundColor = rgb([195, 213, 236]);
        this.tiled_document_button.onclick = function(){
            state.new_document_panel.switch_document_type(this);
        }
    }

    switch_document_type(clicked){
        if(clicked == this.single_image_button){
            this.document_type = "single-image";

            clicked.style.backgroundColor = "transparent";
            this.tiled_document_button.style.backgroundColor = rgb([195, 213, 236]);

            this.tile_width_wrapper.style.display = "none"
            this.tile_height_wrapper.style.display = "none"

            this.document_width_wrapper.style.gridArea = "3 / 1 / span 1 / span 2"
            this.document_height_wrapper.style.gridArea = "4 / 1 / span 1 / span 2"
            this.width_input.style.width = "96%";
            this.height_input.style.width = "96%";
        } else {
            this.document_type = "tiled"

            clicked.style.backgroundColor = "transparent";
            this.single_image_button.style.backgroundColor = rgb([195, 213, 236]);
            
            
            this.document_width_wrapper.style.gridArea = "3 / 1 / span 1 / span 1"
            this.document_height_wrapper.style.gridArea = "4 / 1 / span 1 / span 1"
            this.width_input.style.width = "105px";
            this.height_input.style.width = "105px";
            
            this.tile_width_wrapper.style.display = "block"
            this.tile_height_wrapper.style.display = "block"
        }
    }

    input_validation(input_elem){
        var leading_zero = /^0[0-9].*$/;
        if(leading_zero.test(input_elem.value)){
            input_elem.value = parseInt(input_elem.value, 10);
        } else if (input_elem.value < 0){
            input_elem.value = 0;
        } else if (input_elem.value > 700) {
            input_elem.value = 700;
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
            if (owner.width_input.value == 0){
                owner.width_input.value = 1;
            }
            if (owner.height_input.value == 0){
                owner.height_input.value = 1;
            }
            state.layer_manager.clear_layers();
            
            var document_type = owner.document_type;
            var document_width = owner.width_input.value;
            var document_height = owner.height_input.value;
            var tile_width = owner.tile_width_input.value;
            var tile_height = owner.tile_height_input.value;
            var transparency = owner.transparency_input.checked;
            var name = owner.name_input.value;

            init(document_type, document_width, document_height, tile_width, tile_height, transparency, name);
            
            owner.panel.style.display = "none";
        }
    }
}