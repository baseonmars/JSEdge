var Edge = function(a, b) {
  this.canvas = document.getElementById(b);
  this.canvas.width = a.width;
  this.canvas.height = a.height;
  this.context = this.canvas.getContext("2d");
  this.context.drawImage(a, 0, 0);
  this.imageData = this.context.getImageData(0, 0, a.width, a.height);
  this.pixels = this.imageData.data;
  this.verticalData = this.context.createImageData(a.width, a.height);
  this.width = this.imageData.width;
  this.height = this.imageData.height;
  this.pixelCache = this.context.getImageData(0, 0, a.width, a.hehight).data
};
Edge.prototype.calcEdge = function(a, b, c, d) {
  a = b - a;
  d = d - c;
  b = c - b;
  if(b >= 0) {
    if(a == d && a > b) {
      delta = 0
    }else {
      if(a == d && a < 0) {
        delta = b
      }else {
        delta = b - (a > d ? d : a);
        if(delta < 0) {
          delta = 0
        }else {
          if(delta >= b) {
            delta = b
          }
        }
      }
    }
  }else {
    if(b <= 0) {
      if(a == d && a < b) {
        delta = 0
      }else {
        if(a == d && a > 0) {
          delta = b
        }else {
          delta = b - (a < d ? d : a);
          if(delta > 0) {
            delta = 0
          }else {
            if(delta <= b) {
              delta = b
            }
          }
        }
      }
    }
  }
  return 127 - delta
};
Edge.prototype.buildResult = function() {
  for(x = 0;x < this.width;x++) {
    for(y = 0;y < this.height;y++) {
      var a = 4 * (y * this.width + x), b = this.getPixel(this.pixels, a, 0), c = this.getPixel(this.pixels, a, -4), d = this.getPixel(this.pixels, a, 4), e = this.getPixel(this.pixels, a, 8);
      b = this.calcEdge(c, b, d, e);
      this.writePixel(this.verticalData, a, b, b, b, 255)
    }
  }
};
Edge.prototype.getPixel = function(a, b, c) {
  return this.pixelCache[b] || (this.pixelCache[b] = this.greyscale(this.getRGBPixel(a, b, c)))
};
Edge.prototype.greyscale = function(a) {
  return a.red * 0.3 + a.green * 0.59 + a.blue * 0.11
};
Edge.prototype.getRGBPixel = function(a, b, c) {
  return{red:a[b + c], green:a[b + 1 + c], blue:a[b + 2 + c]}
};
Edge.prototype.writePixel = function(a, b, c, d, e, f) {
  a.data[b] = c;
  a.data[b + 1] = d || c;
  a.data[b + 2] = e || c;
  a.data[b + 3] = f || 255
};

