var state = {
    header: new Header(),
    editor: document.getElementById("editor"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    selection_size_element: document.getElementById("selection-size"),
    draw_buffer: [],

    input: {
        ctrl: false,
        shift: false,
        last_shortcut: null,
        space: false
    },

    null_active_element: document.createElement("div")
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
    state.tiles_x = w / tile_w;
    state.tiles_y = h / tile_h;

    state.current_layer = null;

    state.null_active_element.mousedrag_actions = function(){};
    state.active_element = state.null_active_element;

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
    state.tool_options = new Tool_Options();
    state.tool_handler = new Tool_Handler("drawtool");
    state.layer_manager = new Layer_Manager();
    state.layer_settings = new Layer_Settings();
    state.selection = new Selection();
    state.tile_manager = new Tile_Manager(tile_w, tile_h);
    
    var eyedropper_canvas = document.createElement("canvas");
    state.eyedropper_ctx = eyedropper_canvas.getContext("2d");
    eyedropper_canvas.width = w;
    eyedropper_canvas.height = h;
    
    if (!state.transparency){
        state.canvas_handler.draw_canvas.style.background = "none";
        state.canvas_handler.draw_canvas.style.backgroundColor = "white";
        state.preview_canvas.canvas.style.background = "none";
        state.preview_canvas.canvas.style.backgroundColor = "white"
    } else {
        state.canvas_handler.draw_canvas.style.background = "repeating-linear-gradient(135deg, #ffffff, #ffffff 2.5px, #dbdbdb 2.5px, #dbdbdb 5px );";
        state.canvas_handler.draw_canvas.style.backgroundColor = "transparent";
        state.preview_canvas.canvas.style.background = "repeating-linear-gradient(135deg, #ffffff, #ffffff 2.5px, #dbdbdb 2.5px, #dbdbdb 5px );";
        state.preview_canvas.canvas.style.backgroundColor = "transparent"
    }

    state.tile_manager.add_tile();
}

init("tiled", 4, 4, 16, 16, true, "Untitled");


//Layer test
// state.brush_size = 20;
// state.current_layer.name_elem.innerHTML = "Blue"
// draw_pixel([0, 0, 255, 255], 10, 10);
// state.layer_manager.add_layer();
// state.current_layer.name_elem.innerHTML = "Green"
// draw_pixel([0, 255, 0, 255], 25, 15);
// state.layer_manager.add_layer();
// state.current_layer.name_elem.innerHTML = "Red"
// draw_pixel([255, 0, 0, 255], 15, 25);
// state.layer_manager.change_layer(1);
// state.brush_size = 1;
// state.canvas_handler.paint_tile_grid();