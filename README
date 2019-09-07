# Draw the Flag
A fun and direct way to search flags.

# Build data
Data is fetched from [flags.net](http://flags.net).

## Build flag info
```
var list=[]; columns.forEach((e)=>{
    var a = e.getElementsByTagName("a");
    for (var i=0; i<a.length; i++) {
		var e = a[i];
		var ids = e.getAttribute("href").split("#");
		var id = ids[0].split(".")[0];
        var img = e.getElementsByTagName("img")[0].getAttribute("src");
        img = "images/" + img.split("/")[2];
		list.push({
			code: id,
			name: e.getElementsByClassName("xmlsmallflaglabel")[0].childNodes[0].nodeValue || e.getElementsByTagName("b")[0].innerHTML,
			image: img,
        });
    }
})
```

## Build flag download list
```
var list=[]; columns.forEach((e)=>{
    var a = e.getElementsByTagName("a");
    for (var i=0; i<a.length; i++) {
		var e = a[i];
		var ids = e.getAttribute("href").split("#");
		var id = ids[0].split(".")[0];
        var img = e.getElementsByTagName("img")[0].getAttribute("src");
        img = "http://flags.net/" + img;
		list.push(img);
    }
})
```

## Download list of images
`xargs -n 1 curl -O < ../image-list.txt`
