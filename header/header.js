state.file.onclick = function(){
    state.file_dropdown.style.display = "block";
    state.file.style.backgroundColor = "rgb(116, 116, 124)";
};

state.file.onmouseout = function () {
    state.file_dropdown.style.display = "none";
}

state.file_dropdown.onmouseover = function () {
    state.file_dropdown.style.display = "block";
    state.file.style.backgroundColor = "rgb(116, 116, 124)";
}

state.file_dropdown.onmouseout = function () {
    state.file_dropdown.style.display = "none";
    state.file.style.backgroundColor = "transparent";
}
            
state.save_as.onclick = function(){
    var canvas = document.getElementById("save-canvas");
    canvas.width = state.main_canvas.w * state.zoom;
    canvas.height = state.main_canvas.h * state.zoom;
    var ctx = canvas.getContext("2d");
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    if(!state.transparency){
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, state.main_canvas.w * state.zoom, state.main_canvas.h * state.zoom);
    }
    for(var i = 0; i < state.main_canvas.layers.length; i++){
        ctx.drawImage(state.main_canvas.layers[i].render_canvas, 0, 0, state.main_canvas.w * state.zoom, state.main_canvas.h * state.zoom)
    }
    var saved_img = canvas.toDataURL();
    download_img(saved_img);
}

function download_img(img){
    let link = document.createElement("a");
    let name = get_file_name();
    if(name == null){
        return
    } else {
        link.download = name;
        link.href = img;
        link.click();
    }
}

state.clear.addEventListener("mousedown", function(){
    let clear = confirm("Are you sure?")
    if(clear){
        state.main_canvas.clear();
    }
});