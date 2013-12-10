var render = require('less').render;
var readFile = require('fs').readFile;
var dirname = require('path').dirname;

module.exports = function(source, options) {
  if (options == null) options = {};
  if (!source) throw new Error('source less file path is required');
  var paths = options.paths || [dirname(source)];
  return function(req, res, next) {
    return readFile(source, function(err, txt) {
      return render(txt.toString(), {
        paths: paths
      }, function(err, css) {
        res.writeHead(200, {
          'Content-Type': 'text/css',
          'Content-Length': css ? css.length : 0
        });
        return res.end(css);
      });
    });
  };
};
