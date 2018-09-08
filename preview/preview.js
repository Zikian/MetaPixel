class Preview_Canvas{
    constructor(){
        this.canvas = document.getElementById("preview-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.wrapper = document.getElementById("preview-canvas-area");

        this.canvas.width = state.main_canvas.w;
        this.canvas.height = state.main_canvas.h;

        this.zoom_stages = this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        this.current_zoom = 1;
        this.zoom_element = document.getElementById("preview-zoom-span");

        document.getElementById("preview-zoom-in").onclick = this.button_zoom(this, "in");
        document.getElementById("preview-zoom-out").onclick = this.button_zoom(this, "out");

        this.body = document.getElementById("preview-canvas-area");
        this.resizer = document.getElementById("preview-resizer");
        this.resizer.onmousedown = function(){ state.active_element = this; }
        this.resizer.active_func =  resize_sidebar_window(this);
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

        this.canvas.width = state.main_canvas.w * this.current_zoom;
        this.canvas.height = state.main_canvas.h * this.current_zoom;

        if(origin == "button"){
            this.canvas.style.left = (this.wrapper.offsetWidth - this.canvas.width) / 2 + "px";
            this.canvas.style.top = (this.wrapper.offsetHeight - this.canvas.height) / 2 + "px";
        }

        this.zoom_element.innerHTML = "(" + this.current_zoom + "x)";
        this.redraw();
    }

    redraw(){
        this.clear();
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        for(var i = state.layer_manager.layers.length - 1; i >= 0; i--){
            if (state.layer_manager.layers[i].visible){
                this.ctx.drawImage(state.layer_manager.layers[i].render_canvas, 0, 0, state.main_canvas.w * this.current_zoom, state.main_canvas.h * this.current_zoom);
            }
        }
    }

    clear(){
        this.canvas.width = this.canvas.width;  
    }
}
