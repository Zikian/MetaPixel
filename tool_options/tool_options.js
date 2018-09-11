class Tool_Options{
    constructor(){
        var input_function = null;

        input_function = function(){
            var brush_size = parseInt(state.tool_options.brush_size_input.input.value);
            state.brush_size = brush_size;
            resize_mouse_indicator();
        }
        this.brush_size_input = new Input_Slider("brush-size-input", "", 1, 20, input_function);

        input_function = function(){
            state.color_picker.update_color("tool-options-opacity"); 
        }
        this.opacity_input = new Input_Slider("opacity-input", "", 255, 255, input_function);
    }
}