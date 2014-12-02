var normalise = function(string) {
    return string.toLowerCase().replace(/[- _]/g, '');
};

module.exports = function(User) {
    return {
        check: function(req, res, next) {
            res.locals.user = User.findOne({_id: req.session.user}).populate('participant').exec(function(err, user) {
                res.locals.errors = {};
                res.locals.user = user;
                if (err) res.locals.errors.login = err;
                if (user) user.admin = user.verified && user.email == process.env.ADMIN_EMAIL;
                next();
            });
        },

        authenticated: function(req, res, next) {
            if (res.locals.user) return next();
            res.redirect('/');
        },

        admin: function(req, res, next) {
            if (res.locals.user && res.locals.user.admin) return next();
            res.redirect('/');
        },

        login: function(req, res, next) {
            req.body.ip = req.connection.remoteAddress;
            User[req.body.register ? 'create' : 'authenticate'](req.body, function(err, user) {
                if (user) {

                    return req.session.regenerate(function(err) {
                       res.locals.user = user;
                       req.session.user = user._id
                       next();
                    });
                }

                res.locals.user = req.session.user = null;
                res.locals.errors.login = err;
                res.locals.login = req.body;
                next();
            });
        },

        logout: function(req, res, next) {
            res.locals.user = req.session.user = null;
            next();
        },

        verify: function(req, res, next) {
            var verifyError = "One of those answers was wrong";
            var user = res.locals.user;

            var kon_match = normalise(req.body.verify_kon) == process.env.KON_ANSWER;
            var email_match = req.body.verify_email == user.verifyCode;

            user.verified = kon_match && email_match;
            user.save();

            if (!user.verified) res.locals.errors.verify = verifyError;
            next();
        },

        unlock: function(req, res, next) {
            var unlockError = "Your password was wrong";

            res.locals.user.unlockSanta(req.body.password, function(err, santa) {
                if (err) res.locals.errors.unlock = unlockError;
                else res.locals.santa = santa;
                next();
            });
        }
    };
};
