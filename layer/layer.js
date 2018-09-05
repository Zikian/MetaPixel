class Layer{
    constructor(index, w, h){
        this.visible = true;
        this.index = index;
        this.opacity = 1;
        this.data = [];
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
        this.settings_button.className = "layer-settings-button button"
        var settings_icon = document.createElement("i");
        settings_icon.className = "fas fa-cog";
        
        this.wrapper.className = "layer";
        this.wrapper.style.top = 30 * this.index + "px";
        this.name_elem.innerHTML = "Layer " + index;
        this.visibility_icon.className = "fas fa-circle";
        this.visibility_icon.id = "visibility-icon";
        
        this.settings_button.appendChild(settings_icon);
        this.wrapper.appendChild(this.name_elem);
        this.wrapper.appendChild(this.visibility_icon);
        this.wrapper.appendChild(this.settings_button);
        document.getElementById("layers-area").appendChild(this.render_canvas);
        document.getElementById("layers-area").appendChild(this.wrapper);
        document.getElementById("canvas-wrapper").appendChild(this.canvas);
        
        this.wrapper.onclick = this.change_layer(this);
        this.visibility_icon.onclick = this.toggle_visibility(this, "button")
        this.settings_button.onclick = this.show_settings(this);
        
        this.init_data();
        this.render_img = new Image();
        this.render_img.onload = this.set_render_img(this);
        this.render_img.src = this.render_canvas.toDataURL();
    }

    set_render_img(owner){
        return function(){
            owner.ctx.drawImage(this, 0, 0, owner.w * state.zoom, owner.h * state.zoom);
        }
    }

    show_settings(owner){
        return function(){
            state.layer_settings.open(owner);
        }
    }

    init_data(){
        for(var x = 0; x < this.w; x++){
            this.data.push([]);
            for(var y = 0; y < this.h; y++){
                this.data[x].push(new Pixel_Data());
                this.data_at(x, y).pos = [x, y]
            }
        }
    }

    data_at(x, y){
        if(state.current_selection.contains_pixel_pos(x, y)){
            return this.data[x][y]
        }
        return null;
    }

    get_state(){
        return {
            data: this.data.slice(0),
            index: this.index,
            name: this.name_elem.innerHTML,
            visible: this.visible
        }
    }

    redraw(){
        this.clear();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.oImageSmoothingEnabled = false;
        this.ctx.globalAlpha = this.opacity;
        this.render_img.src = this.render_canvas.toDataURL();
        this.ctx.drawImage(this.render_img, 0, 0, this.w * state.zoom, this.h * state.zoom);
    }

    resize(){
        this.canvas.width = this.w * state.zoom;
        this.canvas.height = this.h * state.zoom;
    }

    draw_pixel(color, x, y){
        var data = this.data_at(x, y);
        if(data == null) { return; }
        if(this.prev_pixel.color == rgba(color) && this.prev_pixel.x == x && this.prev_pixel.y == y){ return; }
        if(rgba(color) == rgba([255, 255, 255, 0])){
            this.ctx.clearRect(x * state.zoom, y * state.zoom, state.zoom, state.zoom);
            this.render_ctx.clearRect(x, y, 1, 1)
        } else {
            this.ctx.beginPath();
            this.ctx.rect(x * state.zoom, y * state.zoom, state.zoom, state.zoom);
            this.ctx.fillStyle = rgba(color);
            this.ctx.fill();
            
            this.render_ctx.beginPath();
            this.render_ctx.rect(x, y, 1, 1);
            this.render_ctx.fillStyle = rgba(color);
            this.render_ctx.fill();
            
        }
        this.prev_pixel = {
            color: rgba(color),
            x: x,
            y: y
        };
        state.history_manager.push_prev_data(data);
        data.rgba = state.color_picker.rgba;
        state.history_manager.push_new_data(data);
    }

    erase_pixel(x, y){
        var data = this.data_at(x, y);
        if(data == null) { return; }
        if(rgba(data.rgba) == rgba([255, 255, 255, 0])){ return; }
        this.draw_pixel([255, 255, 255, 0], x, y);
    }

    line(x0, y0, x1, y1, erase){
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;
        
        this.ctx.beginPath();
        while(true){
            if(erase){
                this.erase_pixel(x0, y0);
            } else {
                this.draw_pixel(state.color_picker.rgba, x0, y0);
            }
    
            if ((x0==x1) && (y0==y1)) { break; }
    
            var e2 = 2 * err;
            
            if (e2 >-dy){ 
                err -= dy; 
                x0 += sx;
            }
            
            if (e2 < dx){ 
                err += dx; 
                y0 += sy; 
            }
        }
    }
    
    ellipse(x0, y0, x1, y1){
        var a = Math.abs(x1-x0), b = Math.abs(y1-y0), b1 = b&1;        /* diameter */
        var dx = 4*(1.0-a)*b*b, dy = 4*(b1+1)*a*a;              /* error increment */
        var err = dx+dy+b1*a*a, e2;                             /* error of 1.step */

        if (x0 > x1) { x0 = x1; x1 += a; }        /* if called with swapped points */
        if (y0 > y1) y0 = y1;                                  /* .. exchange them */
        y0 += (b+1)>>1; y1 = y0-b1;                              /* starting pixel */
        a = 8*a*a; b1 = 8*b*b;                               
                       
        var color = state.color_picker.rgba;    
        do {   
            this.draw_pixel(color, x1, y0);                                      /*   I. Quadrant */
            this.draw_pixel(color, x0, y0);                                      /*  II. Quadrant */
            this.draw_pixel(color, x0, y1);                                      /* III. Quadrant */
            this.draw_pixel(color, x1, y1);                                      /*  IV. Quadrant */
            e2 = 2*err;
            if (e2 <= dy) { y0++; y1--; err += dy += a; }                 /* y step */
            if (e2 >= dx || 2*err > dy) { x0++; x1--; err += dx += b1; }       /* x */
        } while (x0 <= x1);

        while (y0-y1 <= b) {
            this.draw_pixel(color, x0-1, y0);
            this.draw_pixel(color, x1+1, y0++);
            this.draw_pixel(color, x0-1, y1);
            this.draw_pixel(color, x1+1, y1--);
        }
    }

    fill(x, y, new_color, old_color){
        var data = this.data_at(x, y);
        if (data == null) { return; }
        if(rgba(data.rgba) == rgba(new_color)){ return; }
        if(rgba(data.rgba) == rgba(old_color)){
            this.draw_pixel(new_color, x, y);
            if(y < this.h - 1){ this.fill(x, y + 1, new_color, old_color); }
            if(y > 0){ this.fill(x, y - 1, new_color, old_color); }
            if(x < this.w - 1){ this.fill(x + 1, y, new_color, old_color); }
            if(x > 0){ this.fill(x - 1, y, new_color, old_color); }
        }
    }

    clear_rect(x1, y1, w, h){
        this.ctx.clearRect(x1, y1, w, h);
        w /= state.zoom;
        h /= state.zoom;
        x1 /= state.zoom;
        y1 /= state.zoom;
        this.render_ctx.clearRect(x1, y1, w, h);
        for(var x = x1; x < x1 + w; x++){
            for(var y = y1; y < y1 + h; y++){
                this.erase_pixel(x, y);
            }
        }
        state.history_manager.add_history("pen-stroke")
        state.preview_canvas.redraw();
    }

    clear(){
        this.canvas.width = this.canvas.width;
    }

    toggle_visibility(owner, origin){
        return function(){
            window.event.stopPropagation();
            if(owner.visible){
                owner.visible = false;
                owner.canvas.style.display = "none";
                owner.visibility_icon.className = "far fa-circle";
            } else {
                owner.visible = true;
                owner.canvas.style.display = "block";
                owner.visibility_icon.className = "fas fa-circle";
            }
            state.preview_canvas.redraw();
            if(origin == "button"){
                state.history_manager.add_history("layer-visibility", [owner.index]);
            }
        }
    }

    reposition(){
        this.wrapper.style.top = 30 * this.index + "px";
        this.canvas.style.zIndex = state.layer_manager.layers.length - this.index + 5;
    }

    change_layer(owner){
        return function(){
            state.layer_manager.change_layer(owner.index);
        }
    }

    set_active(){
        this.wrapper.style.backgroundColor = "rgb(38, 38, 43)";
        this.settings_button.style.backgroundColor = "rgb(38, 38, 43)";
    }
    
    set_inactive(){
        this.wrapper.style.backgroundColor = "rgb(59, 59, 65)";
        this.settings_button.style.backgroundColor = "rgb(59, 59, 65)";
    }

    delete(){
        document.getElementById("layers-area").removeChild(this.wrapper);
        document.getElementById("layers-area").removeChild(this.render_canvas);
        document.getElementById("canvas-wrapper").removeChild(this.canvas);
    }
}