

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
            var encoder = new GIFEncoder();
            encoder.setRepeat(0);
            encoder.start();

            var canvas = document.createElement("canvas");
            canvas.width = 10 * state.tile_w;
            canvas.height = 10 * state.tile_h;
            var ctx = canvas.getContext("2d");
            ctx.scale(10, 10);

            state.current_anim.frames.forEach(frame => {
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, state.tile_w, state.tile_h);
                var target_rect = [frame.x * state.tile_w, frame.y * state.tile_h, state.tile_w, state.tile_h];
                var frame_rect = [0, 0, state.tile_w, state.tile_h];
                ctx.drawImage(state.canvas_handler.background_canvas, ...target_rect, ...frame_rect);
                ctx.drawImage(state.canvas_handler.foreground_canvas, ...target_rect, ...frame_rect);
                encoder.setDelay(frame.delay);
                encoder.addFrame(ctx);
            });

            encoder.finish();
            var data_url = 'data:image/gif;base64,'+encode64(encoder.stream().getData());
            var img = document.createElement("img");
            img.src = data_url;
            state.editor.appendChild(img)

            return;
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
            var save_canvas = document.createElement("canvas");
            save_canvas.width = canvas_w();
            save_canvas.height = canvas_h();
            var ctx = save_canvas.getContext("2d");
            
            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            if(!state.transparency){
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas_w(), canvas_h());
            }

            var layer = state.layer_manager.layers.length;
            while(layer--){
                ctx.drawImage(state.layer_manager.layers[layer].render_canvas, 0, 0);
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