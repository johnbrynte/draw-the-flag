var mouseDown = false;
document.body.onmousedown = function() {
    mouseDown = true;
}
document.body.onmouseup = function() {
    mouseDown = false;
}
document.body.onmouseleave = function() {
    mouseDown = false;
}
document.body.ondrag = function(evt) {
    evt.preventDefault();
}

var flagData;

var r = new XMLHttpRequest();
//r.open("GET", "flags.json");
r.open("GET", "flag-matrix.json");
r.onload = () => {
    flagData = JSON.parse(r.response);

    init();
};
r.send();

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

function init() {
    //printFlag(0);
    // analyzeFlags(flagData).then(function(data) {
    //     console.log(data);
    // });
    // for (var i = 10; i < 20; i++) {
    //     printFlag(i);
    // }

    initDrawTable();
}

function paint(x, y) {
    var key = currentColor;
    var color = colorKeyLookup[key];
    var rgb;
    if (color == "black") {
        rgb = [0, 0, 0];
    } else if (color == "white") {
        rgb = [255, 255, 255];
    } else {
        rgb = colors[color];
    }
    drawTable[x][y] = key;
    drawTableEl[x][y].style.background = tinycolor({
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
    }).toHexString();
}

function initDrawTable() {
    var w = 16, h = 11;

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

    for (var i = 0; i < colorList.length; i++) {
        var button = document.createElement("input");
        button.setAttribute("type", "button");
        button.value = colorList[i];
        button.onclick = (function(color) {
            return function(evt) {
                currentColor = color;
            };
        })(i);
        document.body.appendChild(button);
    }

    var search = document.createElement("input");
    search.setAttribute("id", "search");
    search.setAttribute("type", "button");
    search.value = "search";
    search.onclick = (function(color) {
        return function(evt) {
            searchFlag(drawTable);
        };
    })(i);
    document.body.appendChild(search);

    var reset = document.createElement("input");
    reset.setAttribute("id", "reset");
    reset.setAttribute("type", "button");
    reset.value = "reset";
    reset.onclick = (function(color) {
        return function(evt) {
            resetDrawTable();
        };
    })(i);
    document.body.appendChild(reset);

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

    var flags = document.getElementById("flag-result");
    flags.innerHTML = "";
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
        var p = document.createElement("p");
        p.innerHTML = result[i][0] + ", " + result[i][1];
        flags.appendChild(p);

        var img = new Image();
        img.src = "images/" + result[i][0] + "0001.GIF";
        flags.appendChild(img);
    }

    var stop = Date.now();

    console.log((stop - start) / 1000);
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