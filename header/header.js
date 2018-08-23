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
    state.saved_img = state.main_canvas.canvas.toDataURL();
    download_img(state.saved_img);
}

state.clear.addEventListener("mousedown", function(){
    let clear = confirm("Are you sure?")
    if(clear){
        state.main_canvas.clear();
    }
});