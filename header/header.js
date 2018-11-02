document.getElementById("undo").onclick = function() { 
    state.history_manager.undo_last(); 
}

document.getElementById("redo").onclick = function(){ 
    state.history_manager.redo_last(); 
}

document.getElementById("clear-button").onclick = function(){
    if(confirm("Are you sure? (This cannot be undone)")){
        state.layer_manager.clear_layers();
        state.canvas_handler.redraw_layers();
        state.canvas_handler.render_drawing();
        state.preview_canvas.render();
    }
}

document.getElementById("file").onclick = function(){
    document.getElementById("file-dropdown").style.display = "block";
};

// document.getElementById("file").onmouseout = function () {
//     event.preventDefault();
//     document.getElementById("file-dropdown").style.display = "none";
// }

document.getElementById("file-dropdown").onmouseover = function () {
    this.style.display = "block";
}

document.getElementById("file-dropdown").onmouseout = function () {
    this.style.display = "none";
}

document.getElementById("export-button").onclick = function(){
    state.export_image_window.open();
}

document.getElementById("selection-settings").onclick = function(){
    document.getElementById("selection-dropdown").style.display = "block"
    this.style.backgroundColor = "rgb(116, 116, 124)";
}

document.getElementById("selection-settings").onmouseout = function(){
    document.getElementById("selection-dropdown").style.display = "none"
    this.style.backgroundColor = "transparent";
}

document.getElementById("selection-dropdown").onmouseover = function(){
    this.style.display = "block";
}

document.getElementById("selection-dropdown").onmouseout = function(){
    this.style.display = "none"
}

document.getElementById("flip-horizontal").onclick = function(){
    state.selection.flip("horizontal");
}

document.getElementById("flip-vertical").onclick = function(){
    state.selection.flip("vertical");
}

document.getElementById("file-input").onchange = function(){
    var file = event.target.files[0];
    if(!file) { return; }
    if(file.type != "image/png" && file.type != "image/jpeg" && file.type != "image/gif"){
        alert("Incorrect filetype (PNG / JPG / GIF)")
        return;
    }

    var reader = new FileReader();
    reader.onload = function(){
        var img = new Image();
        img.onload = function(){
            init("single-image", this.width, this.height, 0, 0, true, file.name);
            state.current_layer.imageSmootingEnabled = false;
            state.current_layer.render_ctx.drawImage(this, 0, 0);
            state.canvas_handler.redraw_background();
            state.canvas_handler.render_drawing();
            state.preview_canvas.render();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}
document.getElementById("open-image-button").onclick = function(){
    document.getElementById("file-input").click();
}