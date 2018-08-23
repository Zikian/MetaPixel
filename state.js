var canvas_area = document.getElementById("canvas-area");
var canvas_wrapper = document.getElementById("canvas-wrapper");
var canvas = document.getElementById("main-canvas");
var line_canvas = document.getElementById("line-canvas");

var mouse_up_functions = [];
var mouse_move_functions = [];

var state = {
    file: document.getElementById("file"),
    file_dropdown: document.getElementById("dropdown"),
    clear: document.getElementById("clear-button"),
    save_as: document.getElementById("save-as"),

    canvas_area: document.getElementById("canvas-area"),
    canvas_wrapper: document.getElementById("canvas-wrapper"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    tools: document.getElementsByClassName("tool"),
    selection_size_element: document.getElementById("selection-size"),
    switch_colors_button: document.getElementById("switch-colors-button"),
    reset_colors_button: document.getElementById("reset-colors-button"),

    color_picker: new Color_Picker(),
    new_document_panel: new New_Document_Panel(),
    main_canvas: new Canvas(canvas,  40, 40),
    tool_handler: new State_Machine("drawtool"),
    current_selection: null,
    line_canvas: null,

    input: {
        space: false,
    },

    transparency: true,
    document_name: "Untitled Document",
    active_element: null,
    pixel_pos: [0, 0],
    abs_mouse_pos: [0, 0],
    current_tool: drawtool,
    mouse_start: [],
    line_end: [],
    rectangle_end: [],
    saved_img: canvas.toDataURL("image/png"),
    mouse_over_canvas_area: false
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
        state.tool_handler.change_tool(this.id);
    }
}
