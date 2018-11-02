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
    state.canvas_handler.draw_ctx.globalAlpha = state.current_layer.opacity;
    state.canvas_handler.draw_ctx.imageSmoothingEnabled = false;
    state.current_layer.render_ctx.fillStyle = rgba(color);
    
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
            
            // Relative position of the brush 
            var relative_x = new_x1 - target_position[0] * state.tile_w;
            var relative_y = new_y1 - target_position[1] * state.tile_h;
        
            //Get intersection of tile and brush
            var tile_clip_x = Math.max(0, relative_x);
            var tile_clip_y = Math.max(0, relative_y);
            var tile_clip_w = Math.min(relative_x + new_w, state.tile_w) - tile_clip_x;
            var tile_clip_h = Math.min(relative_y + new_h, state.tile_h) - tile_clip_y;
            
            //Draw new brush onto each mapped tile
            var position_index = tile.painted_positions.length;
            while(position_index--){
                var position = tile.painted_positions[position_index]
                var absolute_x = tile_clip_x + position[0] * state.tile_w;
                var absolute_y = tile_clip_y + position[1] * state.tile_h;
                state.current_layer.render_ctx.fillRect(absolute_x, absolute_y, tile_clip_w, tile_clip_h);
                state.canvas_handler.draw_ctx.fillRect(absolute_x - state.pixel_hidden_x, absolute_y - state.pixel_hidden_y, tile_clip_w, tile_clip_h);
            }

            tile.ctx.fillStyle = rgba(color);
            tile.ctx.fillRect(relative_x, relative_y, new_w, new_h);
        }
    }

    state.current_layer.render_ctx.fillRect(new_x1, new_y1, new_w, new_h);
    state.canvas_handler.draw_ctx.fillRect(new_x1 - state.pixel_hidden_x, new_y1 - state.pixel_hidden_y, new_w, new_h);
    state.canvas_handler.draw_ctx.globalAlpha = 1;

    state.prev_pixel = { color: rgba(color), x: x, y: y };
    
    if(state.frame_pos == null) { return; }
    state.frame_canvas.ctx.fillStyle = rgba(color);
    state.frame_canvas.ctx.fillRect(new_x1 - state.frame_pos[0], new_y1 - state.frame_pos[1], new_w, new_h);
}

function erase_pixel(x, y) {
    if(!Array.isArray(state.brush_size)){
        state.brush_size = [state.brush_size, state.brush_size]
    }

    var new_x1 = Math.max(state.selection.x, x);
    var new_y1 = Math.max(state.selection.y, y);
    var new_w = Math.min(state.selection.x + state.selection.w, x + state.brush_size[0]) - new_x1;
    var new_h = Math.min(state.selection.y + state.selection.h, y + state.brush_size[1]) - new_y1;

    state.brush_size = state.brush_size[0];
    if(new_w < 0 || new_h < 0) { return; }
    
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

            // Relative position of the brush 
            var relative_x = new_x1 - target_position[0] * state.tile_w;
            var relative_y = new_y1 - target_position[1] * state.tile_h;
        
            //Get intersection of tile and brush
            var tile_clip_x = Math.max(0, relative_x);
            var tile_clip_y = Math.max(0, relative_y);
            var tile_clip_w = Math.min(relative_x + new_w, state.tile_w) - tile_clip_x;
            var tile_clip_h = Math.min(relative_y + new_h, state.tile_h) - tile_clip_y;

            //Draw new brush onto each mapped tile
            var position_index = tile.painted_positions.length;
            while(position_index--){
                var position = tile.painted_positions[position_index]
                var absolute_x = tile_clip_x + position[0] * state.tile_w;
                var absolute_y = tile_clip_y + position[1] * state.tile_h;
                state.current_layer.render_ctx.clearRect(absolute_x, absolute_y, tile_clip_w, tile_clip_h);
            }

            tile.ctx.clearRect(relative_x, relative_y, new_w, new_h);
        }
    }
    state.current_layer.render_ctx.clearRect(new_x1, new_y1, new_w, new_h);
    state.frame_canvas.render();
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
        
        pixel_pos = (x + y * state.doc_w) * 4;
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
            var target_tile = state.current_layer.tilemap[containing_tile[0] + containing_tile[1] * state.tiles_x];
            if(target_tile != null){
                state.tile_manager.tiles[target_tile].ctx.fillStyle = state.color_picker.color;
                state.tile_manager.tiles[target_tile].ctx.fillRect(x - containing_tile[0] * state.tile_w, y - containing_tile[1] * state.tile_h, 1, 1);
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
}

function clear_selection_contents(){
    var prev_brush_size = state.brush_size;
    state.brush_size = [state.selection.w, state.selection.h];
    erase_pixel(state.selection.x, state.selection.y);
    state.brush_size = prev_brush_size;

    state.preview_canvas.render();
    state.canvas_handler.redraw_layers()
    state.canvas_handler.render_drawing();

    state.frame_canvas.render();
}

function paint_tile(tile, x, y){
    state.current_layer.render_ctx.clearRect(x * state.tile_w, y * state.tile_h, state.tile_w, state.tile_h)
    state.current_layer.render_ctx.drawImage(tile.canvas, x * state.tile_w, y * state.tile_h);
    state.canvas_handler.redraw_background();
    state.canvas_handler.render_drawing();
    state.preview_canvas.render();
    state.frame_canvas.render();
}

function preview_pixel(color, x, y){
    if(x < state.selection.x || y < state.selection.y) { return; }
    
    var x = Math.max(state.selection.x, x);
    var y = Math.max(state.selection.y, y);
    var w = Math.min(state.selection.x + state.selection.w, x + state.brush_size) - x;
    var h = Math.min(state.selection.y + state.selection.h, y + state.brush_size) - y;

    if(w < 0 || h < 0) { return; }

    state.canvas_handler.draw_ctx.fillStyle = rgba(color);
    state.canvas_handler.draw_ctx.fillRect(x - state.pixel_hidden_x, y - state.pixel_hidden_y, w, h);

    if(state.frame_pos == null) { return; }
    state.frame_canvas.ctx.fillStyle = rgba(color);
    state.frame_canvas.ctx.fillRect(x - state.frame_pos[0], y - state.frame_pos[1], w, h);
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
