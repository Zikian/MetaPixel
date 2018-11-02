class Tool_Options{
    constructor(){
        var input_function = null;

        input_function = function(){
            var brush_size = parseInt(state.tool_options.brush_size_input.input.value);
            state.brush_size = brush_size;
            state.frame_canvas.mouse_indicator.style.width = state.brush_size * state.frame_canvas.zoom + "px";
            state.frame_canvas.mouse_indicator.style.height = state.brush_size * state.frame_canvas.zoom + "px";
        }
        this.brush_size_input = new Input_Slider("brush-size-input", "", 1, 20, input_function);

        input_function = function(){
            state.color_picker.update_color("tool-options-opacity"); 
        }
        this.opacity_input = new Input_Slider("opacity-input", "", 255, 255, input_function);

        this.tile_indices_input = document.getElementById("tile-indices-input");
        this.tile_indices_input.oninput = function(){
            this.checked ? state.tile_manager.show_indices() : state.tile_manager.hide_indices();
        }
    }
}