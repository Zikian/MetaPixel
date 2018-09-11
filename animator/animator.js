class Animator{
    constructor(){
        this.wrapper = document.getElementById("animator-body");
        this.resizer = document.getElementById("animator-resizer");
        this.resizer.onmousedown = set_active_element;
        this.resizer.active_func = function(){
            var height = document.body.offsetHeight - event.clientY - 10;
            if(height > 0){
                state.animator.wrapper.style.height = clamp(height, 0, 300) + "px"
            } else {
                state.animator.wrapper.style.height = "0px"
            }
        }

        this.animations_window_resizer = document.getElementById("animations-window-resizer");
        this.animations_window_resizer.onmousedown = set_active_element;
        this.animations_window_resizer.active_func = function(){
            var width = event.clientX - document.getElementById("animations-window-body").offsetLeft;
            document.getElementById("animations-window-body").style.width = clamp(width, 100, 300) - 4 + "px";
        }
    }
}