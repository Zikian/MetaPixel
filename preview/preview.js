class Preview_Canvas{
    constructor(){
        this.canvas = document.getElementById("preview-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.wrapper = document.getElementById("preview-body");

        this.canvas.width = state.doc_w;
        this.canvas.height = state.doc_h;

        this.zoom_stages = this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        this.current_zoom = 1;
        this.zoom_element = document.getElementById("preview-zoom-span");

        document.getElementById("preview-zoom-in").onclick = this.button_zoom(this, "in");
        document.getElementById("preview-zoom-out").onclick = this.button_zoom(this, "out");

        var resizer = document.getElementById("preview-resizer");
        resizer.onmousedown = function(){ state.active_element = this; }
        resizer.active_func =  resize_sidebar_window(document.getElementById("preview-body"));
    }

    button_zoom(owner, direction){
        return function(){
            if(direction == "in"){
                owner.zoom("in", "button");
            } else {
                owner.zoom("out", "button")
            }
        }
    }

    zoom(direction, origin = null){
        var zoom_stage_index = this.zoom_stages.indexOf(this.current_zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.current_zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.current_zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }   

        this.canvas.style.width = state.doc_w * this.current_zoom + "px";
        this.canvas.style.height = state.doc_h * this.current_zoom + "px";

        if(origin == "button"){
            this.canvas.style.left = (this.wrapper.offsetWidth - this.canvas.offsetWidth) / 2 + "px";
            this.canvas.style.top = (this.wrapper.offsetHeight - this.canvas.offsetWidth) / 2 + "px";
        }

        this.zoom_element.innerHTML = "(" + this.current_zoom + "x)";
    }

    redraw(){
        this.clear();
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.scale(this.zoom, this.zoom);
        var layers = state.layer_manager.layers.slice();
        layers.reverse().forEach(layer => {
            if(layer.visible){
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.drawImage(layer.render_canvas, 0, 0);
            }
        })
    }

    clear(){
        this.canvas.width = this.canvas.width;  
    }
}
