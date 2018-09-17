function draw_pixel(color, x, y){
    if (state.prev_pixel.color == rgba(color) && state.prev_pixel.x == x && state.prev_pixel.y == y) { return; }

    state.canvas_handler.middleground_ctx.fillStyle = rgba(color);
    state.canvas_handler.middleground_ctx.fillRect(x * state.zoom, y * state.zoom, state.zoom * state.brush_size, state.zoom * state.brush_size);

    state.layer_manager.current_layer.render_ctx.fillStyle = rgba(color)
    state.layer_manager.current_layer.render_ctx.fillRect(x, y, state.brush_size, state.brush_size);

    state.prev_pixel = {
        color: rgba(color),
        x: x,
        y: y
    };
}

function erase_pixel(x, y) {
    state.canvas_handler.middleground_ctx.clearRect(x * state.zoom, y * state.zoom, state.zoom * state.brush_size, state.zoom * state.brush_size)
    state.layer_manager.current_layer.render_ctx.clearRect(x, y, state.brush_size, state.brush_size)
}

function draw_line(x0, y0, x1, y1, erase) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
        if (erase) {
            erase_pixel(x0, y0);
        } else {
            draw_pixel(state.color_picker.rgba, x0, y0);
        }

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

function ellipse(x0, y0, x1, y1) {
    var a = Math.abs(x1 - x0), b = Math.abs(y1 - y0), b1 = b & 1;        /* diameter */
    var dx = 4 * (1.0 - a) * b * b, dy = 4 * (b1 + 1) * a * a;              /* error increment */
    var err = dx + dy + b1 * a * a, e2;                             /* error of 1.step */

    if (x0 > x1) { x0 = x1; x1 += a; }        /* if called with swapped points */
    if (y0 > y1) y0 = y1;                                  /* .. exchange them */
    y0 += (b + 1) >> 1; y1 = y0 - b1;                              /* starting pixel */
    a = 8 * a * a; b1 = 8 * b * b;

    var color = state.color_picker.rgba;
    do {
        draw_pixel(color, x1, y0);                                      /*   I. Quadrant */
        draw_pixel(color, x0, y0);                                      /*  II. Quadrant */
        draw_pixel(color, x0, y1);                                      /* III. Quadrant */
        draw_pixel(color, x1, y1);                                      /*  IV. Quadrant */
        e2 = 2 * err;
        if (e2 <= dy) { y0++; y1--; err += dy += a; }                 /* y step */
        if (e2 >= dx || 2 * err > dy) { x0++; x1--; err += dx += b1; }       /* x */
    } while (x0 <= x1);

    while (y0 - y1 <= b) {
        draw_pixel(color, x0 - 1, y0);
        draw_pixel(color, x1 + 1, y0++);
        draw_pixel(color, x0 - 1, y1);
        draw_pixel(color, x1 + 1, y1--);
    }
}

function rectangle(x1, y1, x2, y2){
    draw_line(x1, y1, x2, y1);
    draw_line(x1, y1, x1, y2);
    draw_line(x1, y2, x2, y2);
    draw_line(x2, y1, x2, y2);
}