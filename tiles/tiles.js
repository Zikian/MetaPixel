class Tiles{
    constructor(){
        this.resizer = document.getElementById("tiles-resizer");
        this.resizer.onmousedown = set_active_element;
        this.body = document.getElementById("tiles-body")
        this.resizer.active_func = resize_sidebar_window(this);
    }
}