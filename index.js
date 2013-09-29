"use strict";

var util = require("util");
var express = require("express"),
    mapnik = require("mapnik"),
    polyline = require("polyline"),
    merc = new (require("sphericalmercator"))();

var wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
var sm = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";

var app = express();

// TODO deploy stylesheet as carto URI (?)
var s = '<Map srs="' + sm + '">';
s += '<Style name="line">';
s += ' <Rule>';
s += '  <LineSymbolizer stroke="blue" stroke-width="2.5" />';
s += '  <LineSymbolizer stroke="#ccc" stroke-width="2" />';
s += ' </Rule>';
s += '</Style>';
s += '</Map>';

// var map = new mapnik.Map(256, 256);
// map.fromStringSync(s);

app.get("/:zoom/:x/:y.png", function(req, res) {
  // TODO pool these
  var map = new mapnik.Map(256, 256);
  map.fromStringSync(s);

  // TODO label?
  var coords = polyline.decodeLine(req.query.q);

  // work in spherical mercator where possible to avoid rounding problems
  var bbox = merc.bbox(+req.params.x, +req.params.y, +req.params.zoom, false, "900913");

  // compare coords' extent against bbox and 404 if it's not contained
  var xs = coords.map(function(x) {
    return x[1];
  });

  var ys = coords.map(function(x) {
    return x[0];
  });

  var minX = Math.min.apply(null, xs);
  var maxX = Math.max.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxY = Math.max.apply(null, ys);

  var envelope = merc.convert([minX, minY, maxX, maxY], "900913").map(function(x, i) {
    // TODO vary the buffer size according to the zoom (pixel width/pixel
    // height, really)
    if (i >= 2) {
      return x + 10000;
    }

    return x - 10000;
  });

  if (!(bbox[0] >= envelope[0] &&
      bbox[1] >= envelope[1] &&
      bbox[2] <= envelope[2] &&
      bbox[3] <= envelope[3])) {
    return res.send(404);
  }

  var wkt = util.format("LINESTRING(%s)", coords.map(function(x) {
    return x.reverse().join(" ");
  }).join(", "));

  var ds = new mapnik.Datasource({
    'type': 'csv',
    'inline': 'id,wkt\n1,"' + wkt + '"\n'
  });

  // construct a mapnik layer dynamically
  var l = new mapnik.Layer('test');
  l.srs = wgs84;
  l.styles = ['line'];

  // add our custom datasource
  l.datasource = ds;

  // add this layer to the map
  map.add_layer(l);

  map.extent = bbox;

  var img = new mapnik.Image(map.width, map.height);
  return map.render(img, function(err, img) {
    return img.encode("png", function(err, buf) {
      res.contentType("image/png");

      return res.send(buf);
    });
  });
});

module.exports = app;
