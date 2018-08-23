class State_Machine{
    constructor(initial_tool){

        this.tools = {
            drawtool: new Draw_Tool("drawtool"),
            eraser: new Eraser_Tool("eraser"),
            line: new Line_Tool("line"),
            select: new Selection_Tool("select"),
            fill: new Fill_Tool("fill"),
            eyedropper: new Eyedropper_Tool("eyedropper"),
            rectangle: new Rectangle_Tool("rectangle")
        }

        this.current_tool = this.tools[initial_tool];
        var tool_elem = document.getElementById(initial_tool);
        tool_elem.style.boxShadow = "0px 0px 0px 3px yellow inset";
        tool_elem.style.backgroundColor = "rgb(66, 66, 66)";
    }   

    change_tool(tool_id){
        var prev_tool_elem = document.getElementById(this.current_tool.id);
        this.current_tool = this.tools[tool_id];
        var tool_elem = document.getElementById(tool_id);
        prev_tool_elem.style.boxShadow = "none";
        prev_tool_elem.style.backgroundColor = "transparent";
        tool_elem.style.boxShadow = "0px 0px 0px 3px yellow inset";
        tool_elem.style.backgroundColor = "rgb(66, 66, 66)";
    }
}

class Draw_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.main_canvas.draw_pixel(state.color_picker.current_color, state.mouse_indicator.offsetLeft, state.mouse_indicator.offsetTop);
        state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].color = state.color_picker.current_color;
        state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].rgba = state.color_picker.current_rgba;
    }

    mousemove_actions(){
        state.main_canvas.draw_buffer.push(state.pixel_pos);
        if (state.main_canvas.draw_buffer.length == 2){
            state.main_canvas.line(...state.main_canvas.draw_buffer[0], ...state.main_canvas.draw_buffer[1])
            state.main_canvas.draw_buffer.shift()
        }
    }

    mouseup_actions(){
        state.main_canvas.draw_buffer = [];
    }
}

class Eraser_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.main_canvas.erase_pixel(...state.pixel_pos)
    }

    mousemove_actions(){
        state.main_canvas.draw_buffer.push(state.pixel_pos);
        if (state.main_canvas.draw_buffer.length == 2){
            state.main_canvas.line(...state.main_canvas.draw_buffer[0], ...state.main_canvas.draw_buffer[1], true)
            state.main_canvas.draw_buffer.shift()
        }
    }

    mouseup_actions(){
        state.main_canvas.draw_buffer = [];
    }
}

class Line_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){}
    
    mousemove_actions(){
        state.line_canvas.clear();
        state.line_end = state.pixel_pos;
        state.line_canvas.line(state.mouse_start[0], state.mouse_start[1], state.pixel_pos[0], state.pixel_pos[1])
    }

    mouseup_actions(){
        state.line_canvas.clear();
        state.main_canvas.line(state.mouse_start[0], state.mouse_start[1], state.pixel_pos[0], state.pixel_pos[1]);
    }
}

class Selection_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.mouse_indicator.style.display = "none"
        document.body.style.cursor = "crosshair";
        state.line_canvas.clear();
    }
    
    mousemove_actions(){
        state.line_canvas.clear();
        state.rectangle_end = state.pixel_pos;
        state.line_canvas.draw_selection();
        handle_selection_size();
    }

    mouseup_actions(){
        state.selection_size_element.style.display = "none";
    }
}

class Fill_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.main_canvas.fill(state.pixel_pos[0], state.pixel_pos[1], state.color_picker.current_rgba, state.main_canvas.data[state.pixel_pos[0]][state.pixel_pos[1]].rgba);
        state.main_canvas.draw_data();
    }
    
    mousemove_actions(){}
    
    mouseup_actions(){}
}

class Eyedropper_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.color_picker.update_color("eyedropper");
    }
    
    mousemove_actions(){
        state.color_picker.update_color("eyedropper");
    }
    
    mouseup_actions(){}
}

class Rectangle_Tool{
    constructor(id){
        this.id = id;
    }

    mousedown_actions(){
        state.rectangle_end = state.mouse_start;
        state.current_selection = new Selection(...state.mouse_start, 1, 1);
        handle_selection_size();
    }
    
    mousemove_actions(){
        state.line_canvas.clear();
        state.rectangle_end = state.pixel_pos;
        state.line_canvas.draw_rectangle(...state.mouse_start, ...state.rectangle_end);
        handle_selection_size();
    }
    
    mouseup_actions(){
        state.line_canvas.clear();
        state.main_canvas.draw_rectangle(...state.mouse_start, ...state.rectangle_end);
        state.selection_size_element.style.display = "none";
    }
}