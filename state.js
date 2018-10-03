var state = {
    header: new Header(),
    editor: document.getElementById("editor"),
    mouse_indicator: document.getElementById("mouse-indicator"),
    selection_size_element: document.getElementById("selection-size"),
    tile_placer_rect: document.getElementById("tile-placer-rect"),
    drawbuffer: [],

    zoom_info: document.getElementById("zoom-info"),
    size_info: document.getElementById("size-info"),
    pixel_pos_info: document.getElementById("pixel-pos-info"),

    input: {
        ctrl: false,
        shift: false,
        last_shortcut: null,
        space: false,
        prevent_doubleclick: false
    },

    null_active_element: document.createElement("div")
};

function destroy_prev_document(){
    state.tile_manager.tiles.forEach(tile => { tile.delete(); });

    for(var x = 0; x < state.tiles_x; x++){
        for(var y = 0; y < state.tiles_y; y++){
            state.editor.removeChild(state.tile_manager.tile_indices[x][y]);
        }
    }

    state.layer_manager.layers.forEach(layer => { layer.delete(); });

    state.animator.animations.forEach(anim => {
        anim.delete();
    })
    state.animator.hide_anim_rects();

}

function init(document_type, doc_w, doc_h, tile_w, tile_h, transparency, name){
    if(state.document_name != null){ destroy_prev_document(); }

    if(document_type == "single-image"){
        state.tile_w = doc_w;
        state.tile_h = doc_h;
    } else {
        doc_w *= tile_w;
        doc_h *= tile_h;
        state.tile_w = tile_w;
        state.tile_h = tile_h;
    }
    
    state.brush_size = 1;
    state.transparency = transparency;
    state.document_name = name;
    state.prev_pixel = {};
    state.doc_w = doc_w;
    state.doc_h = doc_h;
    state.tiles_x = state.doc_w / state.tile_w;
    state.tiles_y = state.doc_h / state.tile_h;
    
    
    state.hidden_x = 0;
    state.hidden_y = 0;
    state.pixel_hidden_x = 0;
    state.pixel_hidden_y = 0;
    
    state.current_layer = null;
    state.current_anim = null;
    
    state.null_active_element.mousedrag_actions = function(){};
    state.active_element = state.null_active_element;

    state.mouse_pos = [0, 0];
    state.pixel_pos = [-100, -100];
    state.frame_pixel_pos = null;
    state.selection_start = null;
    state.selection_end = null;
    state.delta_pixel_pos = null;
    state.delta_mouse = null;
    state.mouse_start = [0, 0];
    state.mouse_end = null;
    state.frame_pos = null;
    state.rect_size = null;

    
    state.new_document_panel = new New_Document_Panel();
    state.history_manager = new History_Manager();
    state.canvas_handler = new Canvas_Handler();
    state.preview_canvas = new Preview_Canvas();
    state.palette = new Palette();
    state.tool_options = new Tool_Options();
    state.tool_handler = new Tool_Handler("drawtool");
    state.layer_manager = new Layer_Manager();
    state.layer_settings = new Layer_Settings();
    state.selection = new Selection();
    state.tile_manager = new Tile_Manager();
    state.tileset_settings = new Tileset_Settings();
    
    state.anim_start_rect = document.getElementById("anim-start-rect");
    state.anim_end_rect = document.getElementById("anim-end-rect");
    state.frame_indicator = document.getElementById("current-frame-indicator");
    state.animator = new Animator();
    state.anim_preview = new Anim_Preview();
    state.frame_canvas = new Frame_Canvas();
    state.color_picker = new Color_Picker();
    state.export_image_window = new Export_Image_Window();
    
    state.size_info.innerHTML = `Size: ${doc_w}x${doc_h}`;
    state.pixel_pos_info.innerHTML = `X: ${0} Y: ${0}`;
    state.zoom_info.innerHTML = `Zoom: ${state.zoom}x`;
    
    var eyedropper_canvas = document.createElement("canvas");
    eyedropper_canvas.width = state.doc_h;
    eyedropper_canvas.height = state.doc_w;
    state.eyedropper_ctx = eyedropper_canvas.getContext("2d");

    state.download_canvas = document.createElement("canvas");
    state.download_canvas.width = state.doc_w;
    state.download_canvas.height = state.doc_h;
    state.download_ctx = state.download_canvas.getContext("2d");

    state.temp_canvas = document.createElement("canvas");
    state.temp_canvas.width = state.doc_w;
    state.temp_canvas.height = state.doc_h;
    state.temp_ctx = state.temp_canvas.getContext("2d");
    
    if (!state.transparency){
        state.canvas_handler.draw_canvas.style.background = "none";
        state.canvas_handler.draw_canvas.style.backgroundColor = "white";
        state.preview_canvas.canvas.style.background = "none";
        state.preview_canvas.canvas.style.backgroundColor = "white"
    } else {
        state.canvas_handler.draw_canvas.style.background = "repeating-linear-gradient(135deg,#ffffff,#ffffff 3px,#ededed 3px,#ededed 6px);";
        state.canvas_handler.draw_canvas.style.backgroundColor = "transparent";
        state.preview_canvas.canvas.style.background = "repeating-linear-gradient(135deg,#ffffff,#ffffff 3px,#ededed 3px,#ededed 6px);";
        state.preview_canvas.canvas.style.backgroundColor = "transparent"
    }
    
    state.tile_placer_rect.style.width = state.tile_w * state.zoom + 1 + "px";
    state.tile_placer_rect.style.height = state.tile_w * state.zoom + 1 + "px";
    state.tile_manager.add_tile();
    state.canvas_handler.render_tile_grid();
    state.preview_canvas.update_visible_rect();
}

init("single-image", 100, 100, 0, 0, true, "Untitled");

function tile_test(){
    state.brush_size = 10;
    state.tile_manager.add_tile();
    state.tile_manager.add_tile();
    state.tile_manager.add_tile();
    state.tile_manager.place_tile(state.tile_manager.tiles[0], 0, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[1], 0, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[2], 1, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[3], 1, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[0], 2, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[1], 2, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[2], 3, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[3], 3, 1);
    draw_pixel([0, 0, 0, 255], 10, 10);
    state.brush_size = 3;
    draw_pixel([0, 0, 0, 255], 20, 20);
}

function layer_tile_test(){
    state.tile_manager.add_tile();
    state.tile_manager.add_tile();
    state.tile_manager.add_tile();
    state.tile_manager.place_tile(state.tile_manager.tiles[0], 0, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[1], 0, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[2], 1, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[3], 1, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[0], 2, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[1], 2, 1);
    state.tile_manager.place_tile(state.tile_manager.tiles[2], 3, 0);
    state.tile_manager.place_tile(state.tile_manager.tiles[3], 3, 1);
    state.brush_size = 20;
    state.current_layer.name_elem.innerHTML = "Blue"
    draw_pixel([0, 0, 255, 255], 10, 10);
    state.layer_manager.add_layer();
    state.current_layer.name_elem.innerHTML = "Green"
    draw_pixel([0, 255, 0, 255], 25, 15);
    state.layer_manager.add_layer();
    state.current_layer.name_elem.innerHTML = "Red"
    draw_pixel([255, 0, 0, 255], 15, 25);
    state.layer_manager.change_layer(1);
}

function layer_test(){
    state.brush_size = 20;
    state.current_layer.name_elem.innerHTML = "Blue"
    draw_pixel([0, 0, 255, 255], 10, 10);
    state.layer_manager.add_layer();
    state.current_layer.name_elem.innerHTML = "Green"
    draw_pixel([0, 255, 0, 255], 25, 15);
    state.layer_manager.add_layer();
    state.current_layer.name_elem.innerHTML = "Red"
    draw_pixel([255, 0, 0, 255], 15, 25);
    state.layer_manager.change_layer(1);
    state.brush_size = 1;
}

function tile_efficiency_test(){
    init("tiled", 30, 30, 16, 16, true, "Untitled");
    for(var x = 0; x < state.tiles_x; x++){
        for(var y = 0; y < state.tiles_y; y++){
            state.tile_manager.place_tile(state.tile_manager.tiles[0], x, y);
        }
    }
}

function delete_tile_test(){
    var current_tile = state.tile_manager.current_tile
    state.tile_manager.place_tile(current_tile, 0, 0)
    state.tile_manager.place_tile(current_tile, 1, 0)
    state.tile_manager.place_tile(current_tile, 2, 0)
    state.tile_manager.add_tile();
    current_tile = state.tile_manager.current_tile;
    state.tile_manager.place_tile(current_tile, 0, 1)
    state.tile_manager.place_tile(current_tile, 1, 1)
    state.tile_manager.place_tile(current_tile, 2, 1)
    state.layer_manager.add_layer();
    state.tile_manager.place_tile(current_tile, 0, 0)
    state.tile_manager.place_tile(current_tile, 1, 0)
    state.tile_manager.place_tile(current_tile, 2, 0)
    state.tile_manager.change_tile(0);
    current_tile = state.tile_manager.current_tile;
    state.tile_manager.place_tile(current_tile, 0, 1)
    state.tile_manager.place_tile(current_tile, 1, 1)
    state.tile_manager.place_tile(current_tile, 2, 1)
    state.tile_manager.delete_tile(current_tile);
}

function swap_tiles_test(){
    state.brush_size = 10;
    state.tile_manager.place_tile(state.tile_manager.current_tile, 0, 0);
    draw_pixel([0,0,0,255], 0, 0)
    state.tile_manager.add_tile();
    state.tile_manager.place_tile(state.tile_manager.current_tile, 1, 0);
    draw_pixel([0,0,0,255], 20, 10)
}

function animation_test(){
    state.animator.add_animation();
    state.current_anim.populate_frames(0, 4)
    // state.animator.add_animation();
    // state.animator.change_animation(1);
    // state.current_anim.populate_frames(5, 5)
    // state.animator.change_animation(0);
}
