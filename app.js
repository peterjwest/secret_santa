var express = require('express');
var RedisStore = require('connect-redis')(express);
var redisParser = require('./lib/redis-url-parser');
var less = require('./lib/less-parser');
var mongoose = require('mongoose');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var emailer = require('./lib/emailer')(sendgrid);
var verifyCode = require('./lib/verify-code');
var solver = require('./lib/solver');
var User = require('./model/user')(mongoose, emailer, verifyCode);
var Exclusion = require('./model/exclusion')(mongoose);
var auth = require('./controller/auth')(User);
var main = require('./controller/main')(User, Exclusion);
var app = express();

mongoose.connect(process.env['MONGOLAB_URI'] || 'mongodb://localhost/secret-santa');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });

app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
    store: new RedisStore(redisParser(process.env['REDISTOGO_URL'])),
    secret: process.env['SESSION_SECRET'] || 'dev'
}));

app.use('/css/style.css', less('public/less/style.less'));
app.use(express.static(__dirname + '/public'));

app.use(auth.check);
app.use(main.users);
app.use(main.exclusions);
app.use(main.checkPossible);
app.use(function(req, res, next) {
    res.locals.kon_question = process.env.KON_QUESTION;
    next();
});

app.use(app.router);

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

app.post('/exclude', auth.admin,  function(req, res) {
    User.all().where('email').in(req.body.exclude).exec(function(err, users) {
        if (err) res.render('index');

        Exclusion.create(users, function(err, exclusion) {
            if (err) return res.render('index');
            return res.redirect('/');
        });
    });
});

app.delete('/exclude/:id', auth.admin,  function(req, res) {
    Exclusion.remove({ _id: req.params.id }, function(err) {
        User.removeExclusion(req.params.id, function(err) {
            return res.redirect('/');
        });
    });
});

app.post('/launch', auth.admin,  function(req, res) {
    var solution = solver(res.locals.users);
    if (solution) {
        var sendSanta = function(solution, next) {
            if (solution.length == 0) return next();

            var pair = solution.pop();
            pair.giver.assignSanta(pair.recipient, function() {
                sendSanta(solution, next);
            });
        };

        return sendSanta(solution, function() {
            res.redirect('/');
        });
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
