var canvas_area = document.getElementById("canvas-area");
var canvas_wrapper = document.getElementById("canvas-wrapper");
var canvas = document.getElementById("main-canvas");
var line_canvas = document.getElementById("line-canvas");

var mouse_up_functions = [];
var mouse_move_functions = [];


var state = {
    file: document.getElementById("file"),
    file_dropdown: document.getElementById("dropdown"),
    canvas_area: document.getElementById("canvas-area"),
    canvas_wrapper: document.getElementById("canvas-wrapper"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    drawtool: document.getElementById("drawtool"),
    erasertool: document.getElementById("eraser"),
    linetool: document.getElementById("line"),
    filltool: document.getElementById("fill"),
    tools: document.getElementsByClassName("tool"),
    clear: document.getElementById("clear-button"),
    save_as: document.getElementById("save-as"),

    active_element: null,
        
    color_picker: new Color_Picker(),

    input: {
        shift: false,
        mousedown: false,
        c: false,
    },

    main_canvas: new Canvas(canvas,  40, 40),
    line_canvas: new Canvas(line_canvas, 40, 40),

    dropdown_display: "none",
    pixel_pos: [0, 0],
    abs_mouse_pos: [0, 0],
    current_tool: drawtool,
    mouse_start: [],
    line_end: [],
    saved_img: canvas.toDataURL("image/png"),
};

for(i = 0; i < state.tools.length; i++){
    state.tools[i].onmouseover = function(){
    }
    state.tools[i].onmouseout = function(){
        if(state.current_tool != this){
            this.style.backgroundColor = "transparent";
        }
    }
    state.tools[i].onclick = function(){
        change_tool(this);
    }
}
