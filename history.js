class History_Manager{
    constructor(){
        this.history = [];
        this.latest_history = this.history[this.history.length - 1];
    }
}

class Pen_Stroke{
    constructor(prev_data){
        this.prev_data = prev_data;
    }

    undo(){
        for(var i = 0; i < this.prev_data.length; i++){
            pos = this.prev_data[i].pos;
            color = this.prev_data[i].color;
            state.main_canvas.draw_pixel(color, ...pos);
        }
    }
}