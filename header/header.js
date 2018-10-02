

class Header{
    constructor(){
        this.file = document.getElementById("file");
        this.file_dropdown = document.getElementById("dropdown");
        this.clear = document.getElementById("clear-button");
        this.export = document.getElementById("export-button");
        
        this.undo = document.getElementById("undo");
        this.undo.onclick = function() { 
            state.history_manager.undo_last(); 
        }

        this.redo = document.getElementById("redo");
        this.redo.onclick = function(){ 
            state.history_manager.redo_last(); 
        }

        this.clear.onclick = function(){
            // var encoder = new GIFEncoder();
            // encoder.setRepeat(0);
            // encoder.start();

            // var canvas = document.createElement("canvas");
            // canvas.width = 10 * state.tile_w;
            // canvas.height = 10 * state.tile_h;
            // var ctx = canvas.getContext("2d");
            // ctx.scale(10, 10);

            // state.current_anim.frames.forEach(frame => {
            //     ctx.imageSmoothingEnabled = false;
            //     ctx.clearRect(0, 0, state.tile_w, state.tile_h);
            //     var target_rect = [frame.x * state.tile_w, frame.y * state.tile_h, state.tile_w, state.tile_h];
            //     var frame_rect = [0, 0, state.tile_w, state.tile_h];
            //     ctx.drawImage(state.canvas_handler.background_canvas, ...target_rect, ...frame_rect);
            //     ctx.drawImage(state.canvas_handler.foreground_canvas, ...target_rect, ...frame_rect);
            //     encoder.setDelay(frame.delay);
            //     encoder.addFrame(ctx);
            // });

            // encoder.finish();
            // var data_url = 'data:image/gif;base64,'+encode64(encoder.stream().getData());
            // var img = document.createElement("img");
            // img.src = data_url;
            // state.editor.appendChild(img)

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

        this.export.onclick = function(){
            state.export_image_window.open();
        }
    }
}