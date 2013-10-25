var express = require('express');
var less = require('connect-lesscss');
var mongoose = require('mongoose');
var fs = require('fs');

var app = express();

mongoose.connect(process.env['MONGOHQ_URL'] || 'mongodb://localhost/lambeth-parks');

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use('/css/style.css', less('public/less/style.less'));
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.set('view options', { pretty: true, layout: false });
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

app.get('/', function(req, res) {
    res.render('index');
});

if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port);
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}
