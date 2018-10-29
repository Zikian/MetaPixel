document.getElementById("undo").onclick = function() { 
    state.history_manager.undo_last(); 
}

document.getElementById("redo").onclick = function(){ 
    state.history_manager.redo_last(); 
}

document.getElementById("clear-button").onclick = function(){
    if(confirm("Are you sure?")){
        state.layer_manager.clear_layers();
    }
}

document.getElementById("file").onclick = function(){
    document.getElementById("file-dropdown").style.display = "block";
    this.style.backgroundColor = "rgb(116, 116, 124)";
};

document.getElementById("file").onmouseout = function () {
    document.getElementById("file-dropdown").style.display = "none";
    this.style.backgroundColor = "transparent";
}

document.getElementById("file-dropdown").onmouseover = function () {
    this.style.display = "block";
}

document.getElementById("file-dropdown").onmouseout = function () {
    this.style.display = "none";
}

document.getElementById("export-image-button").onclick = function(){
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