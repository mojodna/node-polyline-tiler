"use strict";

var path = require("path"),
    util = require("util");
var mapnik = require("mapnik");

var shp = path.join(__dirname, "./buildings");

var ds = new mapnik.Datasource({
  type: "shape",
  file: shp
});

// TODO DataSource.features is broken
// ds.features(0, 1);

var featureset = ds.featureset();

var feat;

var trimRings = function(geom) {
  return geom.map(function(ring) {
    var last = ring[ring.length - 1];

    if (last[0] === 0 && last[1] === 0) {
      // rings may terminate with [0, 0]
      return ring.slice(0, -1);
    }

    return ring;
  });
};

var getFeature = function(id) {
  while ((feat = featureset.next(true))) {
    var f = JSON.parse(feat.toJSON());

    var geom = trimRings(f.geometry.coordinates);

    if (feat.id() === id) {
      return {
        id: feat.id(),
        geom: geom,
        attrs: feat.attributes()
      };
    }
  }
};

var feature = getFeature(1);

var wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

var s = '<Map srs="' + wgs84 + '">';
s += '<Style name="line">';
s += ' <Rule>';
s += '  <PolygonSymbolizer fill="white" />';
s += '  <LineSymbolizer stroke="blue" stroke-width="2.5" />';
s += ' </Rule>';
s += '</Style>';
s += '</Map>';

var map = new mapnik.Map(256, 256);
map.fromStringSync(s);

var wkt = util.format("POLYGON(%s)", feature.geom.map(function(rings) {
  return "(" + rings.map(function(ring) {
    return ring.join(" ");
  }).join(", ") + ")";
}).join(", "));

var ds = new mapnik.Datasource({
  'type': 'csv',
  'inline': 'id,wkt\n1,"' + wkt + '"\n'
});

// contruct a mapnik layer dynamically
var l = new mapnik.Layer('test');
l.srs = map.srs;
l.styles = ['line'];

// add our custom datasource
l.datasource = ds;

// add this layer to the map
map.add_layer(l);

map.zoomAll();
map.renderFileSync('feature.png');
