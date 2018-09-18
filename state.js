var state = {
    header: new Header(),
    editor: document.getElementById("editor"),
    canvas_wrapper: document.getElementById("canvas-wrapper"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    selection_size_element: document.getElementById("selection-size"),
    active_element: null,
    draw_buffer: [],

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
    state.prev_pixel = {};
    state.doc_w = w;
    state.doc_h = h;
    state.tile_w = tile_w;
    state.tile_h = tile_h;
    
    state.canvas_wrapper.style.left = (state.editor.offsetWidth - w * state.zoom)/2  + "px";
    state.canvas_wrapper.style.top = (state.editor.offsetHeight - w * state.zoom)/2 + "px";

    state.canvas_x = state.canvas_wrapper.offsetLeft;
    state.canvas_y = state.canvas_wrapper.offsetTop;

    // Different Mouse Positions
    state.mouse_pos = [0, 0];
    state.pixel_pos = [-100, -100];
    state.selection_start = null;
    state.selection_end = null;
    state.delta_pixel_pos = null;
    state.delta_mouse = null;
    state.mouse_start = null;
    state.mouse_end = null;

    state.color_picker = new Color_Picker();
    state.new_document_panel = new New_Document_Panel();
    state.history_manager = new History_Manager();
    state.canvas_handler = new Canvas_Handler();
    state.preview_canvas = new Preview_Canvas();
    state.palette = new Palette();
    // state.animator = new Animator();
    state.tile_manager = new Tile_Manager(tile_w, tile_h);
    state.tool_options = new Tool_Options();
    state.tool_handler = new Tool_Handler("drawtool");
    state.layer_manager = new Layer_Manager();
    state.layer_settings = new Layer_Settings();
    state.overlay_canvas = new Overlay_Canvas();
    state.selection = new Selection();
    
    var eyedropper_canvas = document.createElement("canvas");
    state.eyedropper_ctx = eyedropper_canvas.getContext("2d");
    eyedropper_canvas.width = w;
    eyedropper_canvas.height = h;
    
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
    
    state.canvas_wrapper.style.width = canvas_w() + "px";
    state.canvas_wrapper.style.height = canvas_h() + "px";
    state.mouse_indicator.style.width = state.zoom * state.brush_size + "px";
    state.mouse_indicator.style.height = state.zoom * state.brush_size + "px";
    state.mouse_indicator.style.left = "-10000px";
    state.mouse_indicator.style.top = "-10000px";
}

init("tiled", 4, 4, 16, 16, true, "Untitled");
