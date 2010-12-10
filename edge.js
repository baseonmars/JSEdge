/**
 * @constructor
 * @param {Image} image Image object
 */
var Edge = function (image, canvas) {

    this.canvas = document.getElementById(canvas);
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.width = image.width;
    this.height = image.height;
    this.context = this.canvas.getContext('2d');
    this.context.drawImage(image, 0,0);
    this.imageData = this.context.getImageData(0,0,image.width,image.height);
    this.pixels = this.imageData.data;
    this.verticalData = this.context.createImageData(image.width,image.height);
    this.horizontalData = this.context.createImageData(image.width,image.height);
    this.magnitudeData = this.context.createImageData(image.width,image.height);
};

/**
 * 
 * @param {Integer} pb Pixel directly before the center pixel
 * @param {Integer} pc Center Pixel
 * @param {Integer} pa Pixel directly after the center pixel
 * @param {integer} pa2 Pixel after pr
 */
Edge.prototype.calcEdge = function calcEdge(pb, pc, pa, pa2) {

    var deltaL = pc - pb;  // ∆L ≡ in − in−1
    var deltaR = pa2 - pa; // ∆R ≡ in+2 − in+1
    var deltaC = pa - pc;  // ∆C ≡ in+1 − in

    /**
     * 0  ≤ ∆ ≤ ∆C  if	∆C ≥ 0
     * ∆C ≤ ∆ ≤ 0   if	∆C ≤ 0
     */
    if (deltaC >= 0) {

        if (deltaL == deltaR && deltaL > deltaC) { 
            delta = 0;
        } else if (deltaL == deltaR && deltaL < 0 ) {
            delta = deltaC;
        } else {
            delta = deltaC - (deltaL > deltaR ? deltaR : deltaL);
            if (delta < 0) {
                delta = 0;
            } else if (delta >= deltaC) {
                delta = deltaC;
            }
        }

    } else if (deltaC <= 0) {

        if (deltaL == deltaR && deltaL < deltaC) {
            delta = 0;
        } else if (deltaL == deltaR && deltaL > 0) {
            delta = deltaC;
        } else {
            delta = deltaC - (deltaL < deltaR ? deltaR: deltaL);
            if (delta > 0) {
                delta = 0;
            } else if (delta <= deltaC) {
                delta = deltaC;
            }
        }

    } 

    return Math.abs(delta);
};


Edge.prototype.buildPixel = function buildPixel(index, offset, acc) {

    var pc  = this.greyscale(this.getRGBPixel(this.pixels, index,  0));
    var pb  = this.greyscale(this.getRGBPixel(this.pixels, index, -offset)); 
    var pa  = this.greyscale(this.getRGBPixel(this.pixels, index,  offset));
    var pa2 = this.greyscale(this.getRGBPixel(this.pixels, index,  offset*2));

    var edge = this.calcEdge(pb, pc, pa, pa2);
    this.writePixel(acc, index, edge, edge, edge, 255);

    }

Edge.prototype.mapVertical = function mapVertical() {

    var width = this.width;
    var height = this.height;

    for (var x = 0; x < (width); x++) {
        for (var y = 0; y < (height); y++) {

            var index = 4 * (y * (width) + x);
            this.buildPixel.call(this, index, this.width * 4, this.verticalData);
        }
    }
};

Edge.prototype.mapHorizontal = function mapHorizontal() {

    var length = this.pixels.length;
    var height = this.height;
    for (var x = 0; x < (length-4); x += 4) {

        var index = x;
        this.buildPixel.call(this, index, 4, this.horizontalData);
    }
};


/**
 * add together 30% of the red value, 59% of the green value,
 * and 11% of the blue value
 *
 * @pixel {RBGPixel} pixel An Object with red, green and blue keys
 */
Edge.prototype.greyscale = function greyscale(pixel) {
    
    return pixel['red'] * 0.30 + pixel['green'] * 0.59 + pixel['blue'] * 0.11;
};

/**
 * @param {PixelArray} pixels
 * @param {Integer} index Index of first pixel
 * @param {Integer} offset Offset of pixel from rgb index
 */
Edge.prototype.getRGBPixel = function getRGBPixel(pixels, index, offset) {

    return { 
        red: pixels[index + offset], 
        green: pixels[index + 1 + offset],
        blue: pixels[index + 2 + offset]
    };
};

/**
 * @param {ImageData} imageDate The image data to be written too
 * @param {Integer} index Start position of the pixel
 * @param {Integer} red Value for red component of pixel
 * @param {Integer} green Value for green component of pixel
 * @param {Integer} blue Value for blue component of pixel
 * @param {Integer} alpha Value for alpha component of pixel
 */
Edge.prototype.writePixel = function writePixel(imageData, index, red, green, blue, alpha) {
    imageData.data[index]   = red;
    imageData.data[index+1] = green || red;
    imageData.data[index+2] = blue  || red;
    imageData.data[index+3] = alpha || 255;
};

Edge.prototype.magnitude = function magnitude() {

    var vData = this.verticalData.data;
    var hData = this.horizontalData.data;
    var mData = this.magnitudeData.data;

    for (var i = 0; i < (vData.length - 4); i+=4) {

        var result = Math.abs(vData[i]) + Math.abs(hData[i]); 
        mData[i] = result;
        mData[i+1] = result;
        mData[i+2] = result;
        mData[i+3] = 255;
    }
}

Edge.prototype.mapMagnitude = function mapMagnitude() {

    var vData = this.verticalData.data;
    var hData = this.horizontalData.data;
    var mData = this.magnitudeData.data;

    for (var i = 0; i < (vData.length - 4); i+=4) {

        var up = hData[i - this.width *4];
        var down = hData[i + this.width *4];
        var left = vData[i - 4];
        var right = vData[i + 4];

        var vAv = (up + down)/2;
        var hAv = (left + right)/2;

        var result = Math.abs(Math.sqrt(vAv*vAv + hAv*hAv) - 255) || 255;
        
        //var result = (Math.abs(vAv) + Math.abs(hAv));
        mData[i] = result;
        mData[i+1] = result;
        mData[i+2] = result;
        mData[i+3] = 255;
    }
}

