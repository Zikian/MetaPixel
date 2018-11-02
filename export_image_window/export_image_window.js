class Export_Image_Window{
    constructor(){
        this.wrapper = document.getElementById("export-window");
        this.form = document.forms["export-form"];

        var owner = this;
        document.getElementById("export-cross").onclick = function(){
            owner.hide();
        };

        this.anim_type = document.getElementById("anim-type");
        this.anim_type.onclick = function(){
            owner.switch_export_type("anim");
        };
        this.image_type = document.getElementById("image-type");
        this.image_type.onclick = function(){
            owner.switch_export_type("image");
        }
        this.tileset_type = document.getElementById("tileset-type");
        this.tileset_type.onclick = function(){
            owner.switch_export_type("tileset");
        }
        
        this.form["download-button"].onclick = function(){
            if(owner.export_type == "image"){
                owner.submit_image();
            } else if (owner.export_type == "anim"){
                owner.submit_anim();
            } else {
                owner.submit_tileset()
            }
        }

        this.form["first-option"].onclick = function(){
            this.checked = !this.checked;
            owner.check_options("first");

        }
        this.form["second-option"].onclick = function(){
            this.checked = !this.checked;
            owner.check_options("second");
        }

        this.second_option_span = document.getElementById("second-option-span");
        this.second_option_span.onclick = function(){
            owner.check_options("second")
        }

        this.first_option_span = document.getElementById("first-option-span");
        this.first_option_span.onclick = function(){
            owner.check_options("first")
        }

        var header = document.getElementById("export-header");
        header.onmousedown = set_active_element;
        header.mousedrag_actions  = function(){ drag_element(state.export_image_window.wrapper, state.delta_mouse); }

        this.form["pixel-scale"].oninput = function(){
            this.value = +(this.value > 16) * 16 || this.value;
        }
        this.form["pixel-scale"].onchange = function(){
            this.value = +(this.value < 1) || this.value;
        }
        
        this.form["padding-pixels"].oninput = function(){
            this.value = +(this.value > 16) * 16 || this.value;
        }
        this.form["padding-pixels"].onchange = function(){
            this.value = +(this.value < 0) || this.value;
        }
        
        this.switch_export_type("image");
    }

    check_options(choice){
        var first = this.form["first-option"].checked;
        var second = this.form["second-option"].checked;
        if(this.export_type == "anim"){
            second = choice == "second";
            first = choice == "first";
        } else if(this.export_type == "image") {
            second = choice == "second" && !second;
            first = choice == "first" && !first;
        } else {
            if(choice == "second"){
                second = !second;
                this.form["padding-pixels"].value = 0;
                this.form["padding-pixels"].disabled = second;
            }
        }

        this.form["first-option"].checked = first;
        this.form["second-option"].checked = second;
    }

    switch_export_type(type){
        this.form["padding-pixels"].style.display = "none";
        this.form["first-option"].style.display = "block";
        this.form["second-option"].checked = false;
        this.form["first-option"].checked = false;
        
        if(type == "image"){
            this.first_option_span.innerHTML = "Layers as separate files"
            this.second_option_span.innerHTML = "Current layer only"
        } else if (type == "anim") {
            this.first_option_span.innerHTML = "All animations";
            this.second_option_span.innerHTML = "Current animation only";
            this.form["second-option"].checked = true;
        } else {
            this.first_option_span.innerHTML = "Padding Pixels:";
            this.second_option_span.innerHTML = "Tiles as separate files";
            this.form["first-option"].style.display = "none";
            this.form["padding-pixels"].style.display = "block";
        }
        
        this.image_type.style.backgroundColor = type == "image" ? "white" : "transparent";
        this.anim_type.style.backgroundColor = type == "anim" ? "white" : "transparent";
        this.tileset_type.style.backgroundColor = type == "tileset" ? "white" : "transparent";
        this.export_type = type;
    }

    open(){
        this.wrapper.style.display = "block";
        this.form["file-name"].value = state.document_name;
    }

    hide(){
        this.wrapper.style.display = "none";
    }

    submit_anim(){
        if(state.animator.animations.length == 0){
            alert("There are no animations to download");
            return;
        }

        var pixel_scale = this.form["pixel-scale"].value;
        if(this.form["second-option"].checked){
            download_current_anim(this.form["file-name"].value, pixel_scale);
        } else if (this.form["first-option"].checked){
            download_all_anims(pixel_scale);
        }
    }

    submit_image(){
        var pixel_scale = this.form["pixel-scale"].value;
        var name = this.form["file-name"].value;

        if(this.form["second-option"].checked){
            download_current_layer(name, pixel_scale);
        } else if (this.form["first-option"].checked){
            download_all_layers(pixel_scale);
        } else {
            download_drawing(name, pixel_scale);
        }

        this.hide();
    }

    submit_tileset(){
        if(state.tile_manager.tiles.length == 0){
            alert("There are no tiles to export");
            return;
        }

        var pixel_scale = this.form["pixel-scale"].value;
        var name = this.form["file-name"].value;
        var padding = parseInt(this.form["padding-pixels"].value);

        if(this.form["second-option"].checked){
            download_all_tiles(name, pixel_scale, padding)
        } else {
            download_tileset(name, pixel_scale);
        }
    }
}