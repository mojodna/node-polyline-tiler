"use strict";

var express = require("express");
var tiler = require("./index");

var app = express();

app.use(express.responseTime());
app.use(cors());
app.use(express.static(__dirname + "/public"));

app.use(tiler);

app.listen(process.env.PORT || 8080, function() {
  console.log("Listening at http://%s:%d/", this.address().address, this.address().port);
});
