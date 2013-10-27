var validate = require('mongoose-validate');
var bcrypt = require('bcrypt');

module.exports = function(mongoose) {

    var UserSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true,
            index: { unique: true },
            validate: [validate.email, "That's not even a real email address"]
        },
        name: { type: String },
        password: { type: String, required: true },
        lastAttempt: { type: Date }
    });

    UserSchema.pre('save', function(next) {
        var user = this;
        if (!user.isModified('password')) return next();

        bcrypt.hash(user.password, 10, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });

    UserSchema.virtual('isLocked').get(function() {
        return this.lastAttempt && this.lastAttempt + 3000 > Date.now();
    });

    UserSchema.methods.comparePassword = function(password, next) {
        var user = this;
        user.update({ lastAttempt: Date.now() }, function(err) {
            if (err) return next(err);
            bcrypt.compare(password, user.password, function(err, match) {
                if (err) return next(err);
                next(null, match);
            });
        });
    };

    UserSchema.methods.failedLogin = function(next) {
        return this.update({ lastAttempt: Date.now() }, next);
    };

    UserSchema.statics.authenticate = function(details, next) {
        var loginError = 'Either your username or password was wrong';
        this.findOne({ email: details.email }, function(err, user) {
            if (err) return next(err);
            if (!user || user.isLocked) return next([loginError], null);

            user.comparePassword(details.password, function(err, match) {
                if (err) return next(err);
                if (match) return next(null, user);
                next([loginError], null);
            });
        });
    };

    UserSchema.statics.create = function(details, next) {
        var model = this.model('User');
        this.findOne({ email: details.email }, function(err, user) {
            if (err) return next(err);
            if (user) return next(null, null);

            var user = new model;
            user.name = details.name;
            user.email = details.email;
            user.password = details.password;
            user.save(function(err) {
                if (err) return next(formatErrors(err));
                next(null, user);
            });
        });
    };

    var User = mongoose.model('User', UserSchema);

    User.checkAuth = function(req, res, next) {
        res.locals.user = req.session.user;
        res.locals.errors = {};
        next();
    };

    User.login = function(req, res, next) {
        User[req.body.register ? 'create' : 'authenticate'](req.body, function(err, user) {
            if (user) {
                return req.session.regenerate(function(err) {
                   res.locals.user = req.session.user = user;
                   next();
                });
            }

            res.locals.user = req.session.user = null;
            res.locals.errors.login = err;
            res.locals.login = req.body;
            next();
        });
    };

    User.logout = function(req, res, next) {
        res.locals.user = req.session.user = null;
        next();
    };

    User.all = function(req, res, next) {
        User.find().exec(function(err, users) {
            res.locals.users = users;
            next();
        });
    };

    return User;
};
