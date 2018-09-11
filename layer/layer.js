class Layer {
    constructor(index, w, h) {
        this.visible = true;
        this.index = index;
        this.opacity = 1;
        this.prev_pixel = {
            color: null,
            x: null,
            y: null
        };

        this.w = w;
        this.h = h;

        this.render_canvas = document.createElement("canvas");
        this.render_canvas.className = "render-canvas";
        this.render_canvas.width = w;
        this.render_canvas.height = h;
        this.render_ctx = this.render_canvas.getContext("2d");

        this.canvas = document.createElement("canvas");
        this.canvas.className = "layer-canvas";
        this.canvas.width = this.w * state.zoom;
        this.canvas.height = this.h * state.zoom;
        this.canvas.style.zIndex = this.index + 5;
        this.ctx = this.canvas.getContext("2d");

        this.wrapper = document.createElement("div");
        this.name_elem = document.createElement("span");
        this.visibility_icon = document.createElement("i");
        this.settings_button = document.createElement("div");
        this.settings_button.className = "button sidebar-window-button layer-settings-button"
        var settings_icon = document.createElement("i");
        settings_icon.className = "fas fa-cog sidebar-window-button-icon";

        this.wrapper.className = "layer";
        this.wrapper.style.top = 30 * this.index + "px";
        this.name_elem.innerHTML = "Layer " + index;
        this.name_elem.className = "sidebar-window-span";
        this.visibility_icon.className = "fas fa-circle visibility-icon";

        this.settings_button.appendChild(settings_icon);
        this.wrapper.appendChild(this.name_elem);
        this.wrapper.appendChild(this.visibility_icon);
        this.wrapper.appendChild(this.settings_button);
        document.getElementById("layers-body").appendChild(this.render_canvas);
        document.getElementById("layers-body").appendChild(this.wrapper);
        document.getElementById("canvas-wrapper").appendChild(this.canvas);

        this.wrapper.onclick = this.change_layer(this);
        this.visibility_icon.onclick = this.toggle_visibility(this, "button")
        this.settings_button.onclick = this.show_settings(this);

        this.body = document.getElementById("layers-body");
        this.resizer = document.getElementById("layers-resizer");
        this.resizer.onmousedown = set_active_element;
        this.resizer.active_func = resize_sidebar_window(this);
    }

    show_settings(owner) {
        return function () {
            state.layer_settings.open(owner);
        }
    }

    data_at(x, y) {
        if(state.selection.contains_pixel(x, y)) {
            return this.render_ctx.getImageData(x, y, 1, 1).data;
        }
        return null;
    }

    get_state() {
        return {
            data: this.render_canvas.toDataURL(),
            index: this.index,
            name: this.name_elem.innerHTML,
            visible: this.visible
        }
    }

    clip(){
        var selectionx = state.selection.x - canvas_x();
        var selectiony = state.selection.y - canvas_y();
        this.ctx.rect(selectionx, selectiony, state.selection.width(), state.selection.height());
        this.ctx.clip();
        this.render_ctx.rect(selectionx / state.zoom, selectiony / state.zoom, state.selection.w, state.selection.h);
        this.render_ctx.clip();
    }

    redraw() {
        this.clear();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.oImageSmoothingEnabled = false;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.scale(state.zoom, state.zoom);
        this.ctx.drawImage(this.render_canvas, 0, 0);
        this.ctx.scale(1 / state.zoom, 1 / state.zoom);
    }

    resize() {
        this.canvas.width = this.w * state.zoom;
        this.canvas.height = this.h * state.zoom;
    }

    draw_pixel(color, x, y) {
        if (this.prev_pixel.color == rgba(color) && this.prev_pixel.x == x && this.prev_pixel.y == y) { return; }

        this.ctx.fillStyle = rgba(color);
        this.ctx.fillRect(x * state.zoom, y * state.zoom, state.zoom * state.brush_size, state.zoom * state.brush_size);
        
        this.render_ctx.fillStyle = rgba(color);
        this.render_ctx.fillRect(x, y, state.brush_size, state.brush_size);

        this.prev_pixel = {
            color: rgba(color),
            x: x,
            y: y
        };
    }

    erase_pixel(x, y) {
        this.ctx.clearRect(x * state.zoom, y * state.zoom,  state.zoom * state.brush_size, state.zoom * state.brush_size);
        this.render_ctx.clearRect(x, y, state.brush_size, state.brush_size)
    }

    line(x0, y0, x1, y1, erase) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        this.ctx.beginPath();
        while (true) {
            if (erase) {
                this.erase_pixel(x0, y0);
            } else {
                this.draw_pixel(state.color_picker.rgba, x0, y0);
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

    fill(x, y, new_color, old_color) {
        var data = this.data_at(x, y);
        if(data == null) { return; }

        var is_old_color = compare_data(data, old_color);
        var is_new_color = compare_data(data, new_color);
        if(is_new_color) { return; }
        if(!is_old_color) { return; }

        this.render_ctx.fillStyle = rgba(new_color);
        this.render_ctx.fillRect(x, y, 1, 1);

        this.fill(x, y + 1, new_color, old_color)
        this.fill(x, y - 1, new_color, old_color)
        this.fill(x + 1, y, new_color, old_color)
        this.fill(x - 1, y, new_color, old_color)
    }

    clear_rect(x1, y1, w, h) {
        this.ctx.clearRect(x1, y1, w, h);
        w /= state.zoom;
        h /= state.zoom;
        x1 /= state.zoom;
        y1 /= state.zoom;
        state.history_manager.prev_data = this.render_canvas.toDataURL();
        this.render_ctx.clearRect(x1, y1, w, h);
        state.history_manager.new_data = this.render_canvas.toDataURL();
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
    }

    clear() {
        this.canvas.width = this.canvas.width;
    }

    toggle_visibility(owner, origin) {
        return function () {
            window.event.stopPropagation();
            if (owner.visible) {
                owner.visible = false;
                owner.canvas.style.display = "none";
                owner.visibility_icon.className = "far fa-circle";
            } else {
                owner.visible = true;
                owner.canvas.style.display = "block";
                owner.visibility_icon.className = "fas fa-circle";
            }
            state.preview_canvas.redraw();
            if (origin == "button") {
                state.history_manager.add_history("layer-visibility", [owner.index]);
            }
        }
    }

    reposition() {
        this.wrapper.style.top = 30 * this.index + "px";
        this.canvas.style.zIndex = state.layer_manager.layers.length - this.index + 5;
    }

    change_layer(owner) {
        return function () {
            state.layer_manager.change_layer(owner.index);
        }
    }

    set_active() {
        this.wrapper.style.backgroundColor = "rgb(38, 38, 43)";
        this.settings_button.style.backgroundColor = "rgb(38, 38, 43)";
    }

    set_inactive() {
        this.wrapper.style.backgroundColor = "rgb(59, 59, 65)";
        this.settings_button.style.backgroundColor = "rgb(59, 59, 65)";
    }

    delete() {
        document.getElementById("layers-body").removeChild(this.wrapper);
        document.getElementById("layers-body").removeChild(this.render_canvas);
        document.getElementById("canvas-wrapper").removeChild(this.canvas);
    }
}