
function hsl(h, s, l){
    return "hsl(" + h + "," + s + "%," + l + "%)";
}

function hsla(h, s, l, a){
    return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
}

function rgba(arr){
    return "rgba(" + arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3] + ")";
}

function rgb_to_hsl(rgbArr){
    var r1 = rgbArr[0] / 255;
    var g1 = rgbArr[1] / 255;
    var b1 = rgbArr[2] / 255;

    var maxColor = Math.max(r1,g1,b1);
    var minColor = Math.min(r1,g1,b1);
    //Calculate L:
    var L = (maxColor + minColor) / 2 ;
    var S = 0;
    var H = 0;
    if(maxColor != minColor){
        //Calculate S:
        if(L < 0.5){
            S = (maxColor - minColor) / (maxColor + minColor);
        }else{
            S = (maxColor - minColor) / (2.0 - maxColor - minColor);
        }
        //Calculate H:
        if(r1 == maxColor){
            H = (g1-b1) / (maxColor - minColor);
        }else if(g1 == maxColor){
            H = 2.0 + (b1 - r1) / (maxColor - minColor);
        }else{
            H = 4.0 + (r1 - g1) / (maxColor - minColor);
        }
    }

    L = L * 100;
    S = S * 100;
    H = H * 60;
    if(H<0){
        H += 360;
    }
    var result = [H, S, L];
    return result;
}

function hsl_to_rgb (h, s, l) {

    var r, g, b, m, c, x

    if (!isFinite(h)) h = 0
    if (!isFinite(s)) s = 0
    if (!isFinite(l)) l = 0

    h /= 60
    if (h < 0) h = 6 - (-h % 6)
    h %= 6

    s = Math.max(0, Math.min(1, s / 100))
    l = Math.max(0, Math.min(1, l / 100))

    c = (1 - Math.abs((2 * l) - 1)) * s
    x = c * (1 - Math.abs((h % 2) - 1))

    if (h < 1) {
        r = c
        g = x
        b = 0
    } else if (h < 2) {
        r = x
        g = c
        b = 0
    } else if (h < 3) {
        r = 0
        g = c
        b = x
    } else if (h < 4) {
        r = 0
        g = x
        b = c
    } else if (h < 5) {
        r = x
        g = 0
        b = c
    } else {
        r = c
        g = 0
        b = x
    }

    m = l - c / 2
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return [r, g, b]

}

function rgb_to_hex(rgb) { 
    var rHex = Number(rgb[0]).toString(16);
    var gHex = Number(rgb[1]).toString(16);
    var bHex = Number(rgb[2]).toString(16);

    if (rHex.length < 2) {
        rHex = "0" + rHex;
    }
    if (gHex.length < 2) {
        gHex = "0" + gHex;
    }
    if (bHex.length < 2) {
        bHex = "0" + bHex;
    }
    return rHex + gHex + bHex;
};

function hex_to_rgb (hex) {
    "use strict";
    if (hex.charAt(0) === '#') {
        hex = hex.substr(1);
    }
    if ((hex.length < 2) || (hex.length > 6)) {
        return false;
    }
    var values = hex.split(''),
        r,
        g,
        b;
    if (hex.length == 1){
        r = 0;
        g = 0;
        b = parseInt("0" + hex, 16);
    } else if (hex.length == 2) {
        r = parseInt(values[0].toString() + values[1].toString(), 16);
        g = r;
        b = r;
    } else if (hex.length == 3) {
        r = parseInt(values[0].toString() + values[0].toString(), 16);
        g = parseInt(values[1].toString() + values[1].toString(), 16);
        b = parseInt(values[2].toString() + values[2].toString(), 16);
    } else if (hex.length == 6) {
        r = parseInt(values[0].toString() + values[1].toString(), 16);
        g = parseInt(values[2].toString() + values[3].toString(), 16);
        b = parseInt(values[4].toString() + values[5].toString(), 16);
    } else {
        return false;
    }
    return [r, g, b];
}