var express = require('express');
var less = require('connect-lesscss');
var mongoose = require('mongoose');
var fs = require('fs');
var User = require('./lib/user')(mongoose);
var app = express();
var sendgrid  = require('sendgrid')(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);

mongoose.connect(process.env['MONGOLAB_URI'] || 'mongodb://localhost/secret-santa');

var formatErrors = function(err) {
    return err ? Object.keys(err.errors).map(function(key) {
        return err.errors[key].type;
    }) : [];
};

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: '1234'}));
    app.use('/css/style.css', less('public/less/style.less'));
    app.use(express.static(__dirname + '/public'));
    app.use(User.checkAuth);
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.set('view options', { pretty: true, layout: false });
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

app.get('/', User.all, function(req, res) {
    res.render('index');
});

app.post('/', User.login, User.all, function(req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('index');
});

app.get('/logout', User.logout, function(req, res) {
    res.redirect('/');
});

if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port);
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}
