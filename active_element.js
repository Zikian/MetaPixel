

state.color_picker.header.onmousedown = function(){
    state.active_element = state.color_picker.header;
}

state.canvas_wrapper.onmousedown = function(){
    state.active_element = state.canvas_wrapper;
}

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}