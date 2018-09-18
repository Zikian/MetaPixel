class Overlay_Canvas{
    constructor(){
        this.canvas = document.getElementById("overlay-canvas");
        this.canvas.width = canvas_w();
        this.canvas.height = canvas_h();
        this.canvas.style.left = canvas_x() + "px";
        this.canvas.style.top = canvas_y() + "px";
        this.ctx = this.canvas.getContext("2d");
    }

    move(){
        this.canvas.style.left = state.selection.editor_x + "px";
        this.canvas.style.top = state.selection.editor_y + "px";
    }

    resize(){
        this.canvas.style.width = state.selection.width();
        this.canvas.style.height = state.selection.height();
    }

    draw_pixel(color, x, y) {
        this.ctx.fillStyle = rgba(color);
        var selection_offset_x = canvas_x() - state.selection.editor_x;
        var selection_offset_y = canvas_y() - state.selection.editor_y;
        this.ctx.fillRect(x * state.zoom + selection_offset_x, y * state.zoom + selection_offset_y, state.zoom * state.brush_size, state.zoom * state.brush_size);
    }

    draw_line(x0, y0, x1, y1) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        while (true) {
            this.draw_pixel(state.color_picker.rgba, x0, y0);

            if ((x0 == x1) && (y0 == y1)) { break; }

            var e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    ellipse(x0, y0, x1, y1) {
        var a = Math.abs(x1 - x0), b = Math.abs(y1 - y0), b1 = b & 1;        /* diameter */
        var dx = 4 * (1.0 - a) * b * b, dy = 4 * (b1 + 1) * a * a;              /* error increment */
        var err = dx + dy + b1 * a * a, e2;                             /* error of 1.step */

        if (x0 > x1) { x0 = x1; x1 += a; }        /* if called with swapped points */
        if (y0 > y1) y0 = y1;                                  /* .. exchange them */
        y0 += (b + 1) >> 1; y1 = y0 - b1;                              /* starting pixel */
        a = 8 * a * a; b1 = 8 * b * b;

        var color = state.color_picker.rgba;
        do {
            this.draw_pixel(color, x1, y0);                                      /*   I. Quadrant */
            this.draw_pixel(color, x0, y0);                                      /*  II. Quadrant */
            this.draw_pixel(color, x0, y1);                                      /* III. Quadrant */
            this.draw_pixel(color, x1, y1);                                      /*  IV. Quadrant */
            e2 = 2 * err;
            if (e2 <= dy) { y0++; y1--; err += dy += a; }                 /* y step */
            if (e2 >= dx || 2 * err > dy) { x0++; x1--; err += dx += b1; }       /* x */
        } while (x0 <= x1);

        while (y0 - y1 <= b) {
            this.draw_pixel(color, x0 - 1, y0);
            this.draw_pixel(color, x1 + 1, y0++);
            this.draw_pixel(color, x0 - 1, y1);
            this.draw_pixel(color, x1 + 1, y1--);
        }
    }

    rectangle(x1, y1, x2, y2){
        this.draw_line(x1, y1, x2, y1);
        this.draw_line(x1, y1, x1, y2);
        this.draw_line(x1, y2, x2, y2);
        this.draw_line(x2, y1, x2, y2);
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}