var mouseDown = false;
document.onmousedown = function() {
    mouseDown = true;
}
document.onmouseup = function() {
    mouseDown = false;
}
document.onmouseleave = function() {
    mouseDown = false;
}
document.ondrag = function(evt) {
    evt.preventDefault();
}

var baseURL = "http://johnbrynte.se/flag/";

var flagData;
var flagInfo;

var loaded = 0;

var r = new XMLHttpRequest();
r.open("GET", "flag-matrix.json");
r.onload = () => {
    flagData = JSON.parse(r.response);

    loaded++;
    if (loaded >= 2) {
        init();
    }
};
r.send();

var r2 = new XMLHttpRequest();
r2.open("GET", "flags.json");
r2.onload = () => {
    flagInfo = {};
    var data = JSON.parse(r2.response);
    for (var i = 0; i < data.length; i++) {
        flagInfo[data[i].code] = data[i];
    }

    loaded++;
    if (loaded >= 2) {
        init();
    }
};
r2.send();

function rgbToNum(r, g, b) {
    var c = b + (g << 8) + (r << 16);
    return c.toString(16);
}

var colorList = ["black", "white", "red", "green", "blue", "yellow"];

var colorKey = {};
var colorKeyLookup = {};

for (var i = 0; i < colorList.length; i++) {
    colorKey[colorList[i]] = i;
    colorKeyLookup[i] = colorList[i];
}

var colors = {
    "red": [231, 76, 60],
    "green": [39, 174, 96],
    "blue": [41, 128, 185],
    "yellow": [241, 196, 15],
};

var colorPalette = {};
var colorPaletteLookup = {};

// var first = true;
for (var c in colors) {
    var h = tinycolor({
        r: colors[c][0],
        g: colors[c][1],
        b: colors[c][2],
    }).toHsv().h;
    // if (first) {
    //     // wrap
    //     first = false;
    //     colorPalette[c] = h+360;
    //     colorPaletteLookup[h+360] = c;
    // }
    colorPalette[c] = h;
    colorPaletteLookup[h] = c;
}
colorPaletteLookup[360] = "red";

var drawTable = [];
var drawTableEl = [];
var currentColor = colorKey["red"];
var currentColorString = getColorString(currentColor);

var canvas;
var ctx;
var brushSize = 10;

var resolution = {
    width: 160,
    height: 110,
    horizontal: 16,
    vertical: 11,
};

function init() {
    // printFlag(0);
    // analyzeFlags(flagData).then(function(data) {
    //     console.log(data);
    // });
    // for (var i = 10; i < 20; i++) {
    //     printFlag(i);
    // }

    initDrawCanvas();
    initDrawTable();
}

function paint(x, y) {
    drawTable[x][y] = currentColor;
    drawTableEl[x][y].style.background = currentColorString;
}

function getColorString(key) {
    var rgb;
    var color = colorKeyLookup[key];
    if (color == "black") {
        rgb = [0, 0, 0];
    } else if (color == "white") {
        rgb = [255, 255, 255];
    } else {
        rgb = colors[color];
    }
    return tinycolor({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
    }).toHexString();
}

function initDrawCanvas() {
    canvas = document.getElementById("canvas");
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, resolution.width, resolution.height);

    var prevPos = null;

    canvas.onmousedown = function(evt) {
        prevPos = convertToCanvasPos(evt.pageX, evt.pageY);
    };

    canvas.onmouseenter = function(evt) {
        if (mouseDown) {
            prevPos = convertToCanvasPos(evt.pageX, evt.pageY);
        }
    };

    canvas.onmousemove = function(evt) {
        if (mouseDown) {
            var pos = convertToCanvasPos(evt.pageX, evt.pageY);

            drawLine(prevPos, pos);

            prevPos = pos;
        }
    };

    canvas.onmouseup = function(evt) {
        convertCanvasToTable();
    };

    canvas.ontouchstart = function(evt) {
        evt.preventDefault();
        var e = evt.touches[0];
        prevPos = convertToCanvasPos(e.pageX, e.pageY);
    };

    canvas.ontouchenter = function() {
        var e = evt.touches[0];
        prevPos = convertToCanvasPos(e.pageX, e.pageY);
    }

    canvas.ontouchmove = function(evt) {
        evt.preventDefault();
        var e = evt.touches[0];
        var pos = convertToCanvasPos(e.pageX, e.pageY);

        drawLine(prevPos, pos);

        prevPos = pos;
    };

    canvas.ontouchend = function() {
        convertCanvasToTable();
    }

    function drawLine(a, b) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = currentColorString;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    function convertToCanvasPos(x, y) {
        return {
            x: resolution.width * (x - canvas.offsetLeft) / canvas.offsetWidth,
            y: resolution.height * (y - canvas.offsetTop) / canvas.offsetHeight,
        };
    }
}

function convertCanvasToTable() {
    var data = ctx.getImageData(0, 0, resolution.width, resolution.height);
    var size = resolution.width / resolution.horizontal;
    var t_color = new tinycolor();

    var _colors = {};
    colorList.forEach(function(c, i) {
        _colors[i] = 0;
    });

    for (var x = 0; x < resolution.horizontal; x++) {
        for (var y = 0; y < resolution.vertical; y++) {
            var r = 0, g = 0, b = 0, a = 0;
            var c = 0;

            colorList.forEach(function(c, i) {
                _colors[i] = 0;
            });

            for (var yy = 0; yy < size; yy++) {
                for (var xx = 0; xx < size; xx++) {
                    var i = 4 * ((y * size + yy) * resolution.width + x * size + xx);

                    r += data.data[i];
                    g += data.data[i + 1];
                    b += data.data[i + 2];
                    a += data.data[i + 3];

                    t_color._r = data.data[i];
                    t_color._g = data.data[i + 1];
                    t_color._b = data.data[i + 2];
                    var hsv = t_color.toHsv();
                    var _color;
                    if (hsv.s < 0.5 || hsv.v < 0.3) {
                        if (hsv.v < 0.5) {
                            _color = 0; // black
                        } else {
                            _color = 1; // white
                        }
                    } else {
                        var hue, closest = Infinity;
                        for (var h in colorPaletteLookup) {
                            var dx = Math.abs(hsv.h - h);
                            if (dx < closest) {
                                closest = dx;
                                hue = h;
                            }
                        }
                        _color = colorList.indexOf(colorPaletteLookup[hue]);
                    }

                    //c += _color;
                    _colors[_color]++;
                }
            }
            r /= size * size;
            g /= size * size;
            b /= size * size;

            c = 0;
            maxColor = 0;
            colorList.forEach(function(_c, i) {
                if (_colors[i] > maxColor) {
                    maxColor = _colors[i];
                    c = i;
                }
            });

            var color = colorList[Math.round(c)];

            drawTable[x][y] = colorKey[color];
            drawTableEl[x][y].style.background = getColorString(colorKey[color]);
        }
    }

    searchFlag(drawTable);
}

function initDrawTable() {
    var w = resolution.horizontal, h = resolution.vertical;

    drawTable = new Array(w);
    drawTableEl = new Array(w);
    for (var x = 0; x < w; x++) {
        drawTable[x] = new Array(h);
        drawTableEl[x] = new Array(h);
    }

    var table = document.getElementById("table");
    for (var y = 0; y < h; y++) {
        var tr = document.createElement("tr");
        table.appendChild(tr);
        for (var x = 0; x < w; x++) {
            var td = document.createElement("td");
            tr.appendChild(td);
            td.onmousemove = (function(x, y) {
                return function(evt) {
                    if (mouseDown) {
                        evt.preventDefault();
                        paint(x, y);
                    }
                };
            })(x, y);

            drawTable[x][y] = colorKey["white"];
            drawTableEl[x][y] = td;
        }
    }

    table.ontouchmove = (function(x, y) {
        return function(evt) {
            evt.preventDefault();
            var e = evt.touches[0];
            var size = table.offsetWidth / w;
            var x = Math.floor((e.pageX - table.offsetLeft) / size);
            var y = Math.floor((e.pageY - table.offsetTop) / size);
            if (x >= 0 && x < w && y >= 0 && y < h) {
                paint(x, y);
            }
        };
    })(x, y);

    table.ontouchend = function() {
        searchFlag(drawTable);
    }

    table.ontouchleave = function() {
        searchFlag(drawTable);
    }

    table.onmouseup = function() {
        searchFlag(drawTable);
    }

    for (var i = 0; i < colorList.length; i++) {
        var button = document.createElement("button");
        button.style.borderColor = getColorString(colorKey[colorList[i]]);
        button.className = "paint-button pen-button";
        button.setAttribute("type", "button");
        var img = new Image();
        img.src = baseURL + "icons/pen-icon.png";
        button.appendChild(img);
        var text = document.createTextNode(colorList[i]);
        button.appendChild(text);
        button.onclick = (function(color, el) {
            return function(evt) {
                [].slice.call(document.getElementsByClassName("pen-button")).forEach(function(_el, i) {
                    _el.style.backgroundColor = "";
                    if (i == 0) {
                        _el.style.color = "black";
                    }
                });
                el.style.backgroundColor = getColorString(colorKey[colorList[color]]);
                if (color == 0) {
                    el.style.color = "white";
                }
                currentColor = color;
                currentColorString = getColorString(currentColor);
            };
        })(i, button);
        document.body.appendChild(button);
    }

    var fillText = document.createElement("p");
    fillText.innerHTML = "Fill:"
    document.body.appendChild(fillText);

    for (var i = 0; i < colorList.length; i++) {
        var button = document.createElement("button");
        button.style.backgroundColor = getColorString(colorKey[colorList[i]]);
        button.className = "paint-button";
        if (i == 0) {
            button.style.color = "white";
        }
        button.setAttribute("type", "button");
        var img = new Image();
        img.src = baseURL + "icons/fill-icon.png";
        button.appendChild(img);
        var text = document.createTextNode(colorList[i]);
        button.appendChild(text);
        button.onclick = (function(color) {
            return function(evt) {
                fillColor(color);
            };
        })(i);
        document.body.appendChild(button);
    }

    var buttonControls = document.createElement("div");
    buttonControls.className = "button-controls";

    var reset = document.createElement("button");
    reset.setAttribute("id", "reset");
    reset.setAttribute("type", "button");
    reset.innerHTML = "Reset";
    reset.onclick = function() {
        resetDrawTable();
    };
    buttonControls.appendChild(reset);

    var size1 = document.createElement("button");
    size1.setAttribute("type", "button");
    size1.innerHTML = "Small brush";
    size1.onclick = function() {
        brushSize = 10;
    };
    buttonControls.appendChild(size1);

    var size2 = document.createElement("button");
    size2.setAttribute("type", "button");
    size2.innerHTML = "Big brush";
    size2.onclick = function() {
        brushSize = 22;
    };
    buttonControls.appendChild(size2);

    document.body.appendChild(buttonControls);

    var flags = document.createElement("div");
    flags.setAttribute("id", "flag-result");
    document.body.appendChild(flags);
}

function resetDrawTable() {
    for (var x = 0; x < drawTable.length; x++) {
        for (var y = 0; y < drawTable[0].length; y++) {
            drawTable[x][y] = colorKey["white"];
            drawTableEl[x][y].style.background = "#ffffff";
        }
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, resolution.width, resolution.height);

    var flags = document.getElementById("flag-result");
    flags.innerHTML = "";
}

function fillColor(color) {
    currentColor = color;
    currentColorString = getColorString(currentColor);
    for (var x = 0; x < drawTable.length; x++) {
        for (var y = 0; y < drawTable[0].length; y++) {
            paint(x, y);
        }
    }

    ctx.fillStyle = currentColorString;
    ctx.fillRect(0, 0, resolution.width, resolution.height);

    searchFlag(drawTable);
}

function searchFlag(inData) {
    var start = Date.now();

    var result = [];
    for (var code in flagData) {
        var m = flagData[code];
        var v = 0;
        for (var x = 0; x < m.length; x++) {
            for (var y = 0; y < m[0].length; y++) {
                if (inData[x][y] == m[x][y]) {
                    v++;
                }
            }
        }
        result.push([code, v]);
    }
    result.sort(function(a, b) {
        return b[1] - a[1];
    });

    var flags = document.getElementById("flag-result");
    flags.innerHTML = "";
    for (var i = 0; i < 10; i++) {
        var data = flagInfo[result[i][0]];

        var flagEl = document.createElement("div");
        flagEl.className = "flag-result__item";

        var p = document.createElement("p");
        p.innerHTML = data.name + ", " + result[i][1] + " (" + result[i][0] + ")";
        flagEl.appendChild(p);

        var img = new Image();
        img.src = baseURL + data.image;
        flagEl.appendChild(img);

        flags.appendChild(flagEl);
    }

    var stop = Date.now();

    //console.log((stop - start) / 1000);
}

function analyzeFlags(inData) {
    return new Promise((resolve, reject) => {
        var outData = {};

        var count = Object.keys(inData).length;

        for (var i = 0; i < inData.length; i++) {
            analyzeFlag(inData[i]).then(done);
        }

        function done(flag) {
            outData[flag.code] = flag.data;

            count--;
            if (count <= 0) {
                resolve(outData);
            }
        }
    });
}

function analyzeFlag(flag) {
    return new Promise((resolve, reject) => {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.src = flag.image;
        img.onload = () => {
            var w = 16, h = 11;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);
            var data = imageData.data;

            var m = new Array(w);
            for (var i = 0; i < m.length; i++) {
                m[i] = new Array(h);
            }

            var x = 0, y = 0;
            for (var i = 0; i < data.length; i += 4) {
                var j = (i / 4) | 0;
                x = j % w;
                y = Math.floor(j / w);

                var color = tinycolor({
                    r: data[i + 0],
                    g: data[i + 1],
                    b: data[i + 2],
                });
                var hsv = color.toHsv();
                if (hsv.s < 0.5 || hsv.v < 0.3) {
                    if (hsv.v < 0.5) {
                        m[x][y] = colorKey["black"];
                    } else {
                        m[x][y] = colorKey["white"];
                    }
                } else {
                    var c, closest = Infinity;
                    for (var v in colorPaletteLookup) {
                        var dx = Math.abs(hsv.h - v);
                        if (dx < closest) {
                            closest = dx;
                            c = v;
                        }
                    }

                    m[x][y] = colorKey[colorPaletteLookup[c]];
                }
            }

            resolve({
                "code": flag.code,
                "data": m,
            });
        };
    });
}

function printFlag(index) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var flag = flagData[index];
    var img = new Image();
    img.onload = () => {
        document.body.appendChild(img);

        canvas.width = 16;
        canvas.height = 11;
        ctx.drawImage(img, 0, 0, 16, 11);
        var imageData = ctx.getImageData(0, 0, 16, 11);
        var data = imageData.data;

        for (var i = 0; i < data.length; i += 4) {
            var color = tinycolor({
                r: data[i + 0],
                g: data[i + 1],
                b: data[i + 2],
            });
            var hsv = color.toHsv();
            if (hsv.s < 0.5 || hsv.v < 0.3) {
                if (hsv.v < 0.5) {
                    data[i + 0] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                } else {
                    data[i + 0] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            } else {
                var c, closest = Infinity;
                for (var v in colorPaletteLookup) {
                    var dx = Math.abs(hsv.h - v);
                    if (dx < closest) {
                        closest = dx;
                        c = v;
                    }
                }

                data[i + 0] = colors[colorPaletteLookup[c]][0];
                data[i + 1] = colors[colorPaletteLookup[c]][1];
                data[i + 2] = colors[colorPaletteLookup[c]][2];
            }
        }
        ctx.putImageData(imageData, 0, 0);

        document.body.appendChild(canvas);
    };
    img.src = flag.image;
}

function getImage(src) {
    var r = new XMLHttpRequest();
    r.open("GET", src, false);
    r.send();

    if (r.status == 200) {
        var img = new Image();
        img.src = src;
        return img;
    } else {
        return null;
    }
}