class Header{
    constructor(){
        this.file = document.getElementById("file");
        this.file_dropdown = document.getElementById("dropdown");
        this.clear = document.getElementById("clear-button");
        this.save_as = document.getElementById("save-as");
        
        this.undo = document.getElementById("undo");
        this.undo.onclick = function() { state.history_manager.undo_last(); }

        this.redo = document.getElementById("redo");
        this.redo.onclick = function(){ state.history_manager.redo_last(); }

        this.clear.onclick = function(){
            if(confirm("Are you sure?")){
                state.layer_manager.clear_layers();
            }
        }

        this.file.onclick = function(){
            state.header.file_dropdown.style.display = "block";
            this.style.backgroundColor = "rgb(116, 116, 124)";
        };
        
        this.file.onmouseout = function () {
            state.header.file_dropdown.style.display = "none";
            this.style.backgroundColor = "transparent";
        }
        
        this.file_dropdown.onmouseover = function () {
            this.style.display = "block";
            state.header.file.style.backgroundColor = "rgb(116, 116, 124)";
        }
        
        this.file_dropdown.onmouseout = function () {
            this.style.display = "none";
            state.header.file.style.backgroundColor = "transparent";
        }

        this.save_as.onclick = function(){
            var save_canvas = document.getElementById("save-canvas");
            save_canvas.width = state.main_canvas.w * state.zoom;
            save_canvas.height = state.main_canvas.h * state.zoom;
            var ctx = save_canvas.getContext("2d");
            
            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            if(!state.transparency){
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, state.main_canvas.w * state.zoom, state.main_canvas.h * state.zoom);
            }

            for(var i = 0; i < state.layer_manager.layers.length; i++){
                ctx.drawImage(state.layer_manager.layers[i].render_canvas, 0, 0, state.main_canvas.w * state.zoom, state.main_canvas.h * state.zoom)
            }

            state.header.download_img(save_canvas.toDataURL());
        }
    }

    download_img(img){
        var link = document.createElement("a");
        var name = get_file_name();
        if(name == null){
            return;
        }
        link.download = name;
        link.href = img;
        link.click();
    }
}