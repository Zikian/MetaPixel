var state = {
    header: new Header(),
    canvas_area: document.getElementById("canvas-area"),
    canvas_wrapper: document.getElementById("canvas-wrapper"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    selection_size_element: document.getElementById("selection-size"),
    active_element: null,

    input: {
        ctrl: false,
        shift: false,
        last_shortcut: null,
        space: false
    }
};

function init(document_type, w, h, tile_w, tile_h, transparency, name){
    if(document_type == "single-image"){
        tile_w = w;
        tile_h = h;
    } else {
        w *= tile_w;
        h *= tile_h;
    }
 
    state.zoom = 8;
    state.prev_zoom = 8;
    state.brush_size = 1;
    state.transparency = transparency;
    state.document_name = name;
    
    // Different Mouse Positions
    state.mouse_pos = [0, 0];
    state.pixel_pos = [0, 0];
    state.selection_start = null;
    state.selection_end = null;
    state.delta_pixel_pos = null;
    state.delta_mouse = null;
    state.mouse_start = null;
    state.mouse_end = null;

    state.color_picker = new Color_Picker();
    state.new_document_panel = new New_Document_Panel();
    state.main_canvas = new Main_Canvas(w, h);
    state.history_manager = new History_Manager();
    state.preview_canvas = new Preview_Canvas();
    state.palette = new Palette();
    // state.animator = new Animator();
    state.tile_manager = new Tile_Manager(tile_w, tile_h);
    state.tool_options = new Tool_Options();
    state.tool_handler = new Tool_Handler("drawtool");
    state.selection = new Selection();
    state.layer_manager = new Layer_Manager(w, h);
    state.layer_settings = new Layer_Settings();
    
    state.eyedropper_ctx = document.getElementById("eyedropper-canvas").getContext("2d");
    document.getElementById("eyedropper-canvas").width = w;
    document.getElementById("eyedropper-canvas").height = h;
    
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
    
    state.canvas_wrapper.style.left = (state.canvas_area.offsetWidth - w * state.zoom)/2  + "px";
    state.canvas_wrapper.style.top = (state.canvas_area.offsetHeight - w * state.zoom)/2 + "px";

    hide_mouse_indicator();
    resize_canvas_wrapper();
    resize_mouse_indicator();
}

init("tiled", 4, 4, 16, 16, true, "Untitled");

