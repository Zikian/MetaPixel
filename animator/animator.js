class Animator{
    constructor(){
        this.wrapper = document.getElementById("animator-body");

        var resizer = document.getElementById("animator-resizer");
        resizer.onmousedown = set_active_element;
        resizer.mousedrag_actions = function(){
            var height = document.body.offsetHeight - event.clientY - 10;
            if(height > 0){
                state.animator.wrapper.style.height = clamp(height, 0, 300) + "px"
            } else {
                state.animator.wrapper.style.height = "0px"
            }
        }

        var animations_window_resizer = document.getElementById("animations-window-resizer");
        animations_window_resizer.onmousedown = set_active_element;
        animations_window_resizer.mousedrag_actions = function(){
            var width = event.clientX - document.getElementById("animations-window-body").offsetLeft;
            document.getElementById("animations-window-body").style.width = clamp(width, 100, 300) - 4 + "px";
        }
    }
}