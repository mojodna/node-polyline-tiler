"use strict";

var assert = require("assert");
var request = require("request");
var tiler = require("..");

describe("polyline-tiler", function() {
  var port = process.env.PORT || 8080,
      server;

  before(function(callback) {
    server = tiler.listen(process.env.PORT || 8080, callback);
  });

  after(function(callback) {
    server.close(callback);
  });

  it("should render a tile containing a fragment of the desired polyline", function(done) {
    return request({
      url: "http://localhost:" + port + "/14/10220/12991.png",
      qs: { q: "ecaoGxbfvLZcA@UY_B]g@YKSSI]YQ[JW@WQEo@BsAKk@K]SSUm@Ce@TYPMNYHi@Nc@LMRBh@AR]Fe@POPc@NoAKa@m@eAScA]Bs@L[EO@MIAURc@PqAN]Bm@e@Yc@g@EUc@{@G_@KW[[IUMK_@m@@SJQDa@" }
    }, function(err, rsp, body) {
      assert.equal("image/png", rsp.headers["content-type"]);

      return done();
    });
  });
});
