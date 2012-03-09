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
    this.seamCostData = [];
};

/**
 * 
 * @param {Integer} pb Pixel directly before the center pixel
 * @param {Integer} pc Center Pixel
 * @param {Integer} pa Pixel directly after the center pixel
 * @param {integer} pa2 Pixel after pr
 */
Edge.prototype.calculate = function calculate(pb, pc, pa, pa2) {

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

Edge.prototype.map = function map () {

    var width = this.width;
    var height = this.height;
    var length = this.pixels.length

    for (var i = 0; i < length; i += 4) {
        var x = i + 4;
        var y = x + width * 4;
        // todo calculate edges
        this.buildPixel.call(this, x, 4, this.horizontalData);
        this.buildPixel.call(this, y, width * 4, this.verticalData);
    }
}


Edge.prototype.buildPixel = function buildPixel(index, offset, acc) {

    var pixels = this.pixels;
    var pc  = this.greyscale(this.getRGBPixel(pixels, index,  0));
    var pb  = this.greyscale(this.getRGBPixel(pixels, index, -offset)); 
    var pa  = this.greyscale(this.getRGBPixel(pixels, index,  offset));
    var pa2 = this.greyscale(this.getRGBPixel(pixels, index,  offset*2));

    var edge = this.calculate(pb, pc, pa, pa2);
    this.writePixel(acc, index, edge, edge, edge, 255);

    }

Edge.prototype.mapMagnitude = function mapMagnitude() {

    var vData = this.verticalData.data;
    var hData = this.horizontalData.data;
    var mData = this.magnitudeData.data;
    var width = this.width;
    var iWidth = this.width * 4;
    var baseColor = 255;

    for (var i = vData.length - iWidth - 4; i >= 0; i-=4) {

        // TODO prevent edge comparisson from wrapping
        var up = hData[i];
        var down = hData[i + iWidth];
        var left = vData[i];
        var right = vData[i + 4];

        var vav = (up + down)/2;
        var hav = (left + right)/2;

        result =  Math.sqrt(Math.pow(vav,2) + Math.pow(hav,2));

        mData[i] = result;
        mData[i+1] = result;
        mData[i+2] = result;
        mData[i+3] = 255;
    }
}

Edge.prototype.mapSeamCost = function mapSeamCost() {

    var mData = this.magnitudeData.data;
    var scData = [];

    var length = mData.length;
    var height = this.height;
    for (var x = 0; x < (length-4); x += 4) {

        var index = x;
        var pixelValue = mData[index];

        var nextI = index + this.width;
        var offset = 4;

        nl = new Edge.SeamCandidate(mData[nextI - offset], nextI - offset);
        nc = new Edge.SeamCandidate(mData[nextI], nextI);
        nr = new Edge.SeamCandidate(mData[nextI + offset], nextI + offset);

        var nextValue = [nc,nl,nr].sort(function(a,b) { 
            return a.cost - b.cost;
        }).shift();
        var scIndex = index > 4 ? index/4 : 0;

        scData[scIndex] = new Edge.SeamPixel(nextValue.cost, nextValue.index);
    }

    this.seamCostData = scData;
}

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
    var data = imageData.data;
    data[index]   = red;
    data[index+1] = green || red;
    data[index+2] = blue  || red;
    data[index+3] = alpha || 255;
};

Edge.SeamPixel = function(cost, nextI) {
    this.cost = cost;
    this.nextIndex = nextI;
};

Edge.SeamCandidate = function(cost, index) {
    this.cost = cost;
    this.index = index;
};

Edge.SeamCandidate.prototype.valueOf = function () {
    return this.cost;
};
