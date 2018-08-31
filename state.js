var mouse_up_functions = [];
var mouse_move_functions = [];

var state = {};

function init(w = 40, h = 40, transparency = true, name = "Untitled Document"){
    state.file = document.getElementById("file");
    state.file_dropdown = document.getElementById("dropdown");
    state.clear = document.getElementById("clear-button");
    state.save_as = document.getElementById("save-as");
    state.undo = document.getElementById("undo");
    state.redo = document.getElementById("redo");
    
    state.canvas_area = document.getElementById("canvas-area");
    state.canvas_wrapper = document.getElementById("canvas-wrapper");
    
    state.mouse_indicator = document.getElementById("mouse-indicator");
    state.tools = document.getElementsByClassName("tool");
    state.selection_size_element = document.getElementById("selection-size");
    state.switch_colors_button = document.getElementById("switch-colors-button");
    state.reset_colors_button = document.getElementById("reset-colors-button");
    
    state.zoom = 8;
    state.prev_zoom = 8;
    
    state.color_picker = new Color_Picker();
    state.color_picker.update_color();
    
    state.new_document_panel = new New_Document_Panel();
    state.main_canvas = new Canvas(w, w);
    state.history_manager = new History_Manager();
    state.preview_canvas = new Preview_Canvas()

    state.eyedropper_ctx = document.getElementById("eyedropper-canvas").getContext("2d");
    document.getElementById("eyedropper-canvas").width = w;
    document.getElementById("eyedropper-canvas").height = h;
    
    state.transparency = transparency;
    if (!state.transparency){
        state.canvas_wrapper.style.background = "none";
        state.canvas_wrapper.style.backgroundColor = "white";
        state.preview_canvas.canvas.style.background = "none";
        state.preview_canvas.canvas.style.backgroundColor = "white"
    } else {
        state.canvas_wrapper.style.background = "repeating-linear-gradient(135deg, #ffffff, #ffffff 2.5px, #dbdbdb 2.5px, #dbdbdb 5px );";
        state.canvas_wrapper.style.backgroundColor = "transparent";
        state.preview_canvas.canvas.style.background = "repeating-linear-gradient(135deg, #ffffff, #ffffff 2.5px, #dbdbdb 2.5px, #dbdbdb 5px );";
        state.preview_canvas.canvas.style.backgroundColor = "transparent"
    }
    
    state.tool_handler = new State_Machine("drawtool");
    state.current_tool = null;
    state.tool_handler.change_tool("drawtool");
    
    
    state.document_name = name;
    state.saved_img = null;
    state.active_element = null;
    
    // Different Mouse Positions
    state.pixel_pos = [0, 0];
    state.delta_pixel_pos = null;
    state.abs_mouse_pos = [0, 0];
    state.delta_mouse = null;
    state.mouse_start = null;
    state.line_end = null;
    state.rectangle_end = null;
    state.selection_end = null;
    
    state.input = {
        ctrl: false,
        shift: false,
        last_shortcut: null
    };
    
    resize_canvas_wrapper();
    resize_mouse_indicator();
    state.canvas_wrapper.style.left = (state.canvas_area.clientWidth - state.canvas_wrapper.clientWidth)/2  + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.clientHeight - state.canvas_wrapper.clientHeight)/2 + "px";
    
    state.current_selection = new Selection();
    state.selection_canvas = null;
}

init();

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
