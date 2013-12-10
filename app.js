var express = require('express');
var less = require('./lib/less-parser');
var mongoose = require('mongoose');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var verifyCode = require('./lib/verify-code');
var solver = require('./lib/solver');
var User = require('./model/user')(mongoose, sendgrid, verifyCode);
var auth = require('./controller/auth')(User);
var main = require('./controller/main')(User);
var app = express();

mongoose.connect(process.env['MONGOLAB_URI'] || 'mongodb://localhost/secret-santa');

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: '1234'}));
    app.use('/css/style.css', less('public/less/style.less'));
    app.use(express.static(__dirname + '/public'));
    app.use(auth.check);
    app.use(main.users);
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
    if (res.locals.user) {
        res.locals.user.encryptSanta('Pete');
        res.locals.user.save();
    }
    res.render('index');
});

app.post('/', auth.login, function(req, res) {
    if (res.locals.user) return res.redirect('/');
    res.render('index');
});

app.post('/verify', auth.authenticated, auth.verify,  function(req, res) {
    if (res.locals.user.verified) return res.redirect('/');
    res.render('index');
});

app.post('/unlock', auth.authenticated, auth.unlock,  function(req, res) {
    res.render('index');
});

app.get('/unlock', function(req, res) {
    res.redirect('/');
});

app.post('/launch', auth.admin,  function(req, res) {
    var solution = solver(res.locals.users);
    if (solution) {
        console.log(solution.map(function(s) { return s.giver.name+' => '+s.recipient.name; }));
        return res.redirect('/');
    }
    res.render('index');
});

app.get('/logout', auth.logout, function(req, res) {
    res.redirect('/');
});

if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port);
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}
