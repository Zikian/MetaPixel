class Preview_Canvas{
    constructor(){
        this.canvas = document.getElementById("preview-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.wrapper = document.getElementById("preview-body");

        this.canvas.width = state.doc_w;
        this.canvas.height = state.doc_h;

        this.zoom_stages = this.zoom_stages = [1, 2, 3, 4, 5, 6, 8, 12, 18];
        this.zoom = 1;
        this.zoom_element = document.getElementById("preview-zoom-span");

        document.getElementById("preview-zoom-in").onclick = function(){ state.preview_canvas.zoom_canvas("in") };
        document.getElementById("preview-zoom-out").onclick = function(){ state.preview_canvas.zoom_canvas("out") };

        var resizer = document.getElementById("preview-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = function(){
            resize_sidebar_window(document.getElementById("preview-body"))();
            state.preview_canvas.update_visible_rect();
        } 

        this.canvas_visible_rect = document.getElementById("canvas-visible-rect");
    }

    zoom_canvas(direction, origin = null){
        var zoom_stage_index = this.zoom_stages.indexOf(this.zoom);
        if (direction == "in" && zoom_stage_index < this.zoom_stages.length - 1){
            this.zoom = this.zoom_stages[zoom_stage_index + 1]; 
        } else if (direction == "out" && zoom_stage_index > 0) {
            this.zoom = this.zoom_stages[zoom_stage_index - 1]; 
        }   

        this.canvas.style.width = state.doc_w * this.zoom + "px";
        this.canvas.style.height = state.doc_h * this.zoom + "px";

        if(origin == "button"){
            this.canvas.style.left = (this.wrapper.offsetWidth - this.canvas.offsetWidth) / 2 + "px";
            this.canvas.style.top = (this.wrapper.offsetHeight - this.canvas.offsetWidth) / 2 + "px";
        }

        this.zoom_element.innerHTML = "(" + this.zoom + "x)";
        this.update_visible_rect();
    }

    update_visible_rect(){
        var offset_x = this.canvas.offsetLeft - canvas_x() * this.zoom / state.zoom;
        var offset_y = this.canvas.offsetTop - canvas_y() * this.zoom / state.zoom;
        var w = (state.editor.offsetWidth / state.zoom) * this.zoom;
        var h = (state.editor.offsetHeight / state.zoom) * this.zoom;

        this.canvas_visible_rect.style.left = offset_x + "px";
        this.canvas_visible_rect.style.top = offset_y + "px";
        this.canvas_visible_rect.style.width = w + "px";
        this.canvas_visible_rect.style.height = h + "px";
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
            if(layer == state.current_layer){
                this.ctx.drawImage(state.selection.paste_canvas, state.selection.x * this.zoom, state.selection.y * this.zoom);
            }
        })
    }

    clear(){
        this.canvas.width = this.canvas.width;  
    }
}
