function draw_pixel(color, x, y){
    if (state.prev_pixel.color == rgba(color) && state.prev_pixel.x == x && state.prev_pixel.y == y) { return; }

    //Get intersection rectangle of brush and selection
    var new_x1 = Math.max(state.selection.x, x);
    var new_y1 = Math.max(state.selection.y, y);
    var new_w = Math.min(state.selection.x + state.selection.w, x + state.brush_size) - new_x1;
    var new_h = Math.min(state.selection.y + state.selection.h, y + state.brush_size) - new_y1;

    //If brush is outside selection, return
    if(new_w < 0 || new_h < 0) { return; }

    state.canvas_handler.draw_ctx.fillStyle = rgba(color)
    state.canvas_handler.draw_ctx.imageSmoothingEnabled = false;
    state.current_layer.render_ctx.fillStyle = rgba(color)

    //Get the tiles and tile positions that will be affected by the brush
    var containing_tiles = state.tile_manager.get_containing_tiles(new_x1, new_y1, new_w, new_h);
    var target_tiles = state.current_layer.get_painted_tiles(containing_tiles);
    var tile_index = target_tiles.indices.length;

    if(tile_index){
        //One or more tiles were targeted
        while(tile_index--){
            //Tile that is being drawn on
            var tile = state.tile_manager.tiles[target_tiles.indices[tile_index]];

            // Position of painted tile that is being drawn on
            var target_position = target_tiles.positions[tile_index];

            //Draw to the tile
            tile.ctx.fillStyle = rgba(color);
            tile.ctx.fillRect(new_x1 - target_position.x * state.tile_w, new_y1 - target_position.y * state.tile_h, new_w, new_h);

            //Draw the resulting tile at its mapped positions
            tile.painted_positions.forEach(position => {
                paint_tile(tile, ...position);
            })
        }
    } else {
        //No specific tile was targeted
        state.current_layer.render_ctx.fillRect(new_x1, new_y1, new_w, new_h);
        state.canvas_handler.draw_ctx.fillRect(new_x1 - hidden_x() / state.zoom, new_y1 - hidden_y() / state.zoom, new_w, new_h);
    }

    state.prev_pixel = { color: rgba(color), x: x, y: y };
}

function erase_pixel(x, y) {
    var selection_x = (state.selection.editor_x - canvas_x()) / state.zoom;
    var selection_y = (state.selection.editor_y - canvas_y()) / state.zoom;

    var new_x1 = Math.max(selection_x, x);
    var new_y1 = Math.max(selection_y, y);
    var new_w = Math.min(selection_x + state.selection.w, x + state.brush_size) - new_x1;
    var new_h = Math.min(selection_y + state.selection.h, y + state.brush_size) - new_y1;
    if(new_w < 0 || new_h < 0) { return; }

    state.current_layer.render_ctx.clearRect(new_x1, new_y1, new_w, new_h);
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
    if(rgba(new_color) == rgba(old_color)){return}
    
    pixel_stack = [[x, y]];
    
    selection_x = state.selection.x;
    selection_y = state.selection.y;
    
    var colorLayer = state.current_layer.render_ctx.getImageData(0, 0, state.doc_w, state.doc_h);

    while(pixel_stack.length) {
        var new_pos, pixel_pos, reach_left, reach_right;
        new_pos = pixel_stack.pop();
        x = new_pos[0];
        y = new_pos[1];
        
        pixel_pos = (y * state.doc_w + x) * 4;
        while(y-- >= selection_y && matchStartColor(pixel_pos)) {
            pixel_pos -= state.doc_w * 4;
        }
        
        //Increment pixel pos back into selection bounds
        pixel_pos += state.doc_w * 4;
        ++y;
        reach_left = false;
        reach_right = false;
        while(y++ < selection_y + state.selection.h - 1 && matchStartColor(pixel_pos)){
            var containing_tile = state.tile_manager.get_containing_tile(x, y);
            var target_tile = state.current_layer.painted_tiles[containing_tile.x][containing_tile.y];
            if(target_tile != null){
                state.tile_manager.tiles[target_tile].ctx.fillRect(x - containing_tile.x * state.tile_w, y - containing_tile.y * state.tile_h, 1, 1);
            }   
            colorPixel(pixel_pos)
            if(x > selection_x){
                if(matchStartColor(pixel_pos - 4)){
                    if(!reach_left){
                        pixel_stack.push([x - 1, y]);
                        reach_left = true;
                    }
                }   else if(reach_left){
                    reach_left = false;
                }
            }
            if(x < selection_x + state.selection.w - 1){
                if(matchStartColor(pixel_pos + 4)) {
                    if(!reach_right){
                        pixel_stack.push([x + 1, y]);
                        reach_right = true;
                    }
                } else if(reach_right){
                    reach_right = false;
                }
            }
                    
            pixel_pos += state.doc_w * 4;
        }
    }
    state.current_layer.render_ctx.putImageData(colorLayer, 0, 0);
    
    function matchStartColor(pixel_pos){
        var r = colorLayer.data[pixel_pos];	
        var g = colorLayer.data[pixel_pos+1];	
        var b = colorLayer.data[pixel_pos+2];
        var a = colorLayer.data[pixel_pos+3];

        return (r == old_color[0] && g == old_color[1] && b == old_color[2] && a == old_color[3]);
    }

    function colorPixel(pixelPos){
        colorLayer.data[pixelPos] = new_color[0];
        colorLayer.data[pixelPos+1] = new_color[1];
        colorLayer.data[pixelPos+2] = new_color[2];
        colorLayer.data[pixelPos+3] = 255;
    }






    // if(!state.selection.contains_pixel(x, y)){ return; }

    // var layer = state.current_layer;
    // var data = layer.render_ctx.getImageData(x, y, 1, 1).data;

    // var is_old_color = compare_colors(data, old_color);
    // var is_new_color = compare_colors(data, new_color);
    // if(is_new_color) { return; }
    // if(!is_old_color) { return; }

    // var target_position = state.tile_manager.get_containing_tile(x, y);
    // var target_index = state.current_layer.painted_tiles[target_position.x][target_position.y];
    // if(target_index != null){
    //     var tile = state.tile_manager.tiles[target_index];
    //     var offset_x = x - target_position.x;
    //     var offset_y = y - target_position.y;
    //     tile.painted_positions.forEach(position => {
    //         layer.render_ctx.fillRect(position.x + offset_x, position.y + offset_y, 1, 1);
    //     })
    //     tile.ctx.fillRect(offset_x, offset_y, 1, 1);
    // } else {
    //     layer.render_ctx.fillRect(x, y, 1, 1);
    // }
    
    // fill(x, y + 1, new_color, old_color);
    // fill(x, y - 1, new_color, old_color);
    // fill(x + 1, y, new_color, old_color);
    // fill(x - 1, y, new_color, old_color); 
}

const trampoline = fn => (...args) => {
    let result = fn(...args)
    
    while (typeof result === 'function') {
      result = result()
    }
    
    return result
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

function paint_tile(tile, x, y){
    state.canvas_handler.draw_ctx.clearRect(x * state.tile_w, y * state.tile_h, state.tile_w, state.tile_h)
    state.canvas_handler.draw_ctx.drawImage(tile.canvas, x * state.tile_w, y * state.tile_h);
    state.current_layer.render_ctx.clearRect(x * state.tile_w, y * state.tile_h, state.tile_w, state.tile_h)
    state.current_layer.render_ctx.drawImage(tile.canvas, x * state.tile_w, y * state.tile_h);
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

function sumBelowRec(number, sum = 9){
    if(number == 0){ return sum; }
    return sumBelowRec(number - 1, sum + number)
}