/**
 * @constructor
 * @param {Image} image Image object
 */
var Edge = function (image, canvas) {

    this.canvas = document.getElementById(canvas);
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.context = this.canvas.getContext('2d');
    this.context.drawImage(image, 0,0);
    this.imageData = this.context.getImageData(0,0,image.width,image.height);
    this.pixels = this.imageData.data;
    this.verticalData = this.context.createImageData(image.width,image.height);
    this.width = this.imageData.width;
    this.height = this.imageData.height;
};

/**
 * 
 * @param {Integer} pb Pixel directly before the center pixel
 * @param {Integer} pc Center Pixel
 * @param {Integer} pa Pixel directly after the center pixel
 * @param {integer} pa2 Pixel after pr
 */
Edge.prototype.calcEdge = function (pb, pc, pa, pa2) {

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

    return 127 - delta;
};

/**
 *
 */
Edge.prototype.buildResult = function () {

    for (x = 0; x < (this.width); x++) {
        for (y = 0; y < (this.height); y++) {

            var index = 4 * (y * (this.width) + x);

            var pc  = this.greyscale(this.getRGBPixel(this.pixels, index,  0));
            var pb  = this.greyscale(this.getRGBPixel(this.pixels, index, -4)); 
            var pa  = this.greyscale(this.getRGBPixel(this.pixels, index,  4));
            var pa2 = this.greyscale(this.getRGBPixel(this.pixels, index,  8));

            var edge = this.calcEdge(pb, pc, pa, pa2);

            this.writePixel(this.verticalData, index, edge);
        }

    }
};


/**
 * add together 30% of the red value, 59% of the green value,
 * and 11% of the blue value
 *
 * @pixel {RBGPixel} pixel An Object with red, green and blue keys
 */
Edge.prototype.greyscale = function (pixel) {
    
    return pixel['red'] * 0.30 + pixel['green'] * 0.59 + pixel['blue'] * 0.11;
};

/**
 * @param {PixelArray} pixels
 * @param {Integer} index Index of first pixel
 * @param {Integer} offset Offset of pixel from rgb index
 */
Edge.prototype.getRGBPixel = function (pixels, index, offset) {

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
Edge.prototype.writePixel = function(imageData, index, red, green, blue, alpha) {
    imageData.data[index]   = red;
    imageData.data[index+1] = green || red;
    imageData.data[index+2] = blue  || red;
    imageData.data[index+3] = alpha || 255;
};
