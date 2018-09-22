function draw_pixel(color, x, y){
    if (state.prev_pixel.color == rgba(color) && state.prev_pixel.x == x && state.prev_pixel.y == y) { return; }

    var selection_canvas_x = (state.selection.editor_x - canvas_x()) / state.zoom;
    var selection_canvas_y = (state.selection.editor_y - canvas_y()) / state.zoom;
    var pixel_canvas_x = x;
    var pixel_canvas_y = y;

    var new_x1 = Math.max(selection_canvas_x, pixel_canvas_x);
    var new_y1 = Math.max(selection_canvas_y, pixel_canvas_y);
    var new_x2 = Math.min(selection_canvas_x + state.selection.w, pixel_canvas_x + state.brush_size);
    var new_y2 = Math.min(selection_canvas_y + state.selection.h, pixel_canvas_y + state.brush_size);

    var new_w = new_x2 - new_x1;
    var new_h = new_y2 - new_y1;

    if(new_w < 0 || new_h < 0) { return; }

    var containing_tile = state.tile_manager.get_containing_tile(new_x1, new_y1);
    if(containing_tile.x == null || containing_tile.y == null){ return; }
    var target_tile = state.current_layer.painted_tiles[containing_tile.x][containing_tile.y];

    state.canvas_handler.draw_ctx.fillStyle = rgba(color)
    state.current_layer.render_ctx.fillStyle = rgba(color)
    if(target_tile != null){
        state.tile_manager.tiles[target_tile].painted_positions.forEach(position => {
            var offset_x = (position[0] - containing_tile.x) * state.tile_w;
            var offset_y = (position[1] - containing_tile.y) * state.tile_h;
            state.current_layer.render_ctx.fillRect(new_x1 + offset_x, new_y1 + offset_y, new_w, new_h);
            state.canvas_handler.draw_ctx.fillRect(new_x1 - hidden_x() / state.zoom + offset_x, new_y1 - hidden_y() / state.zoom + offset_y, new_w, new_h);
        })
        state.tile_manager.tiles[target_tile].ctx.fillStyle = rgba(color);
        state.tile_manager.tiles[target_tile].ctx.fillRect(new_x1 - containing_tile.x * state.tile_w, new_y1 - containing_tile.y * state.tile_h, new_w, new_h);
    } else {
        state.current_layer.render_ctx.fillRect(new_x1, new_y1, new_w, new_h);
        state.canvas_handler.draw_ctx.fillRect(new_x1 - hidden_x() / state.zoom, new_y1 - hidden_y() / state.zoom, new_w, new_h);
    }


    state.prev_pixel = {
        color: rgba(color),
        x: x,
        y: y
    };
}

function erase_pixel(x, y) {
    var selection_canvas_x = state.selection.editor_x - canvas_x();
    var selection_canvas_y = state.selection.editor_y - canvas_y();
    var pixel_canvas_x = x * state.zoom;
    var pixel_canvas_y = y * state.zoom;

    var new_x1 = Math.max(selection_canvas_x, pixel_canvas_x);
    var new_y1 = Math.max(selection_canvas_y, pixel_canvas_y);
    var new_x2 = Math.min(selection_canvas_x + state.selection.width(), pixel_canvas_x + state.brush_size * state.zoom);
    var new_y2 = Math.min(selection_canvas_y + state.selection.height(), pixel_canvas_y + state.brush_size * state.zoom);

    var new_w = new_x2 - new_x1;
    var new_h = new_y2 - new_y1;

    if(new_w < 0 || new_h < 0) { return; }

    state.current_layer.render_ctx.clearRect(new_x1 / state.zoom, new_y1 / state.zoom, new_w / state.zoom, new_h / state.zoom);
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

function fill(x, y, new_color, old_color) {
    if(!state.selection.contains_pixel(x, y)){ return; }

    var layer = state.current_layer;
    var data = layer.render_ctx.getImageData(x, y, 1, 1).data;

    var is_old_color = compare_colors(data, old_color);
    var is_new_color = compare_colors(data, new_color);
    if(is_new_color) { return; }
    if(!is_old_color) { return; }
    
    layer.render_ctx.fillRect(x, y, 1, 1);

    fill(x, y + 1, new_color, old_color);
    fill(x, y - 1, new_color, old_color);
    fill(x + 1, y, new_color, old_color);
    fill(x - 1, y, new_color, old_color); 
}

function clear_selection_contents(){
    var x = state.selection.editor_x - canvas_x();
    var y = state.selection.editor_y - canvas_y();

    state.history_manager.prev_data = state.current_layer.get_data();
    state.current_layer.render_ctx.clearRect(x / state.zoom, y / state.zoom, state.selection.w, state.selection.h);
    state.history_manager.add_history("pen-stroke");

    state.preview_canvas.redraw();
    state.canvas_handler.redraw_layers()
    state.canvas_handler.render_draw_canvas();
}

function paint_tile(x, y){
    state.canvas_handler.draw_ctx.clearRect(x * state.tile_w, y * state.tile_h, state.tile_w, state.tile_h)
    state.canvas_handler.draw_ctx.drawImage(state.tile_manager.current_tile.canvas, x * state.tile_w, y * state.tile_h);
    state.current_layer.render_ctx.clearRect(x * state.tile_w, y * state.tile_h, state.tile_w, state.tile_h)
    state.current_layer.render_ctx.drawImage(state.tile_manager.current_tile.canvas, x * state.tile_w, y * state.tile_h);
    state.preview_canvas.redraw();
}

function preview_pixel(color, x, y){
    var selection_canvas_x = (state.selection.editor_x - canvas_x()) / state.zoom;
    var selection_canvas_y = (state.selection.editor_y - canvas_y()) / state.zoom;
    var pixel_canvas_x = x;
    var pixel_canvas_y = y;

    var new_x1 = Math.max(selection_canvas_x, pixel_canvas_x);
    var new_y1 = Math.max(selection_canvas_y, pixel_canvas_y);
    var new_x2 = Math.min(selection_canvas_x + state.selection.w, pixel_canvas_x + state.brush_size);
    var new_y2 = Math.min(selection_canvas_y + state.selection.h, pixel_canvas_y + state.brush_size);

    var new_w = new_x2 - new_x1;
    var new_h = new_y2 - new_y1;

    if(new_w < 0 || new_h < 0) { return; }

    state.canvas_handler.draw_ctx.fillStyle = rgba(color);
    state.canvas_handler.draw_ctx.fillRect(new_x1, new_y1, new_w, new_h);
}

function preview_line(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
        this.preview_pixel(state.color_picker.rgba, x0, y0);

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

function preview_ellipse(x0, y0, x1, y1) {
    var a = Math.abs(x1 - x0), b = Math.abs(y1 - y0), b1 = b & 1;        /* diameter */
    var dx = 4 * (1.0 - a) * b * b, dy = 4 * (b1 + 1) * a * a;              /* error increment */
    var err = dx + dy + b1 * a * a, e2;                             /* error of 1.step */

    if (x0 > x1) { x0 = x1; x1 += a; }        /* if called with swapped points */
    if (y0 > y1) y0 = y1;                                  /* .. exchange them */
    y0 += (b + 1) >> 1; y1 = y0 - b1;                              /* starting pixel */
    a = 8 * a * a; b1 = 8 * b * b;

    var color = state.color_picker.rgba;
    do {
        preview_pixel(color, x1, y0);                                      /*   I. Quadrant */
        preview_pixel(color, x0, y0);                                      /*  II. Quadrant */
        preview_pixel(color, x0, y1);                                      /* III. Quadrant */
        preview_pixel(color, x1, y1);                                      /*  IV. Quadrant */
        e2 = 2 * err;
        if (e2 <= dy) { y0++; y1--; err += dy += a; }                 /* y step */
        if (e2 >= dx || 2 * err > dy) { x0++; x1--; err += dx += b1; }       /* x */
    } while (x0 <= x1);

    while (y0 - y1 <= b) {
        preview_pixel(color, x0 - 1, y0);
        preview_pixel(color, x1 + 1, y0++);
        preview_pixel(color, x0 - 1, y1);
        preview_pixel(color, x1 + 1, y1--);
    }
}

function preview_rectangle(x1, y1, x2, y2){
    preview_line(x1, y1, x2, y1);
    preview_line(x1, y1, x1, y2);
    preview_line(x1, y2, x2, y2);
    preview_line(x2, y1, x2, y2);
}