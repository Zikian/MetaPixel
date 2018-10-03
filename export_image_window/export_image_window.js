class Export_Image_Window{
    constructor(){
        this.wrapper = document.getElementById("export-image-window");

        this.form = document.forms["export-image-form"];

        var owner = this;
        document.getElementById("export-image-cross").onclick = function(){
            owner.hide();
        };

        this.anim_type = document.getElementById("anim-type")
        this.anim_type.onclick = function(){
            owner.switch_export_type("anim");
        };
        
        this.image_type = document.getElementById("image-type")
        this.image_type.onclick = function(){
            owner.switch_export_type("image");
        }
        
        this.form["download-image"].onclick = function(){
            owner.export_type == "image" ? owner.submit_image() : owner.submit_anim();
        }
        this.form["export-current"].onclick = function(){
            this.checked = !this.checked;
            owner.toggle_all_current("current");
        }
        this.form["export-all"].onclick = function(){
            this.checked = !this.checked;
            owner.toggle_all_current("all");
        }
        document.getElementById("export-current-span").onclick = function(){
            owner.toggle_all_current("current")
        }
        document.getElementById("export-all-span").onclick = function(){
            owner.toggle_all_current("all")
        }

        var header = document.getElementById("export-image-header");
        header.onmousedown = set_active_element;
        header.mousedrag_actions  = function(){ drag_element(state.export_image_window.wrapper, state.delta_mouse); }

        this.form["pixel-scale"].oninput = function(){
            this.value = +(this.value > 16) * 16 || this.value;
        }
        this.form["pixel-scale"].onchange = function(){
            this.value = +(this.value < 1) || this.value;
        }
        
        this.switch_export_type("image");
    }

    toggle_all_current(choice){
        var all = this.form["export-all"].checked;
        var current = this.form["export-current"].checked;
        if(this.export_type == "anim"){
            current = choice == "current";
            all = choice == "all";
        } else {
            current = choice == "current" && !current;
            all = choice == "all" && !all;
        }

        this.form["export-current"].checked = current;
        this.form["export-all"].checked = all;
    }

    switch_export_type(type){
        if(type == "image"){
            this.image_type.style.backgroundColor = "transparent"
            this.anim_type.style.backgroundColor = rgb([195, 213, 236]);
            document.getElementById("export-current-span").innerHTML = "Current layer"
            document.getElementById("export-all-span").innerHTML = "All layers"
        } else {
            this.form["export-current"].checked = true;
            this.form["export-all"].checked = false;
            this.anim_type.style.backgroundColor = "transparent"
            this.image_type.style.backgroundColor = rgb([195, 213, 236]);
            document.getElementById("export-current-span").innerHTML = "Current animation"
            document.getElementById("export-all-span").innerHTML = "All animations"
        }
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
        if(this.form["export-current"].checked){
            download_current_anim(this.form["file-name"].value, pixel_scale);
        } else if (this.form["export-all"].checked){
            download_all_anims(pixel_scale);
        }
    }

    submit_image(){
        var pixel_scale = this.form["pixel-scale"].value;
        var name = this.form["file-name"].value;

        if(this.form["export-current"].checked){
            download_current_layer(name, pixel_scale);
        } else if (this.form["export-all"].checked){
            download_all_layers(pixel_scale);
        } else {
            download_drawing(name, pixel_scale);
        }

        this.hide();
    }
}