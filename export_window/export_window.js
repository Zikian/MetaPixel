class Export_Image_Window{
    constructor(){
        this.wrapper = document.getElementById("export-window");

        this.form = document.forms["export-image-form"];

        document.getElementById("export-window-cross").onclick = function(){
            state.export_image_window.hide();
        };
        
        var owner = this;
        this.form["download-image"].onclick = function(){
            owner.submit();
        }
        this.form["download-current-layer"].onclick = function(){
            if(owner.form["download-layers"].checked){
                owner.form["download-layers"].checked = false;
            }
        }
        this.form["download-layers"].onclick = function(){
            if(owner.form["download-current-layer"].checked){
                owner.form["download-current-layer"].checked = false;
            }
        }

        this.header = document.getElementById("export-window-header");
        this.header.onmousedown = set_active_element;
        this.header.mousedrag_actions  = function(){ drag_element(state.export_image_window.wrapper, state.delta_mouse); }
    }

    open(){
        this.wrapper.style.display = "block";
        this.form["file-name"].value = state.document_name;
    }

    hide(){
        this.wrapper.style.display = "none";
    }

    submit(){
        var pixel_scale = this.form["pixel-scale"].value;
        var name = this.form["file-name"].value;

        if(this.form["download-current-layer"].checked){
            download_current_layer(name, pixel_scale);
        } else if (this.form["download-layers"].checked){
            download_all_layers(name, pixel_scale);
        } else {
            download_drawing(name, pixel_scale);
        }

        this.hide();
    }
}