var solver = require('../lib/solver');

module.exports = function(User, Exclusion) {
    return {
        users: function(req, res, next) {
            User.all().exec(function(err, users) {
                res.locals.users = users;
                next();
            });
        },

        exclusions: function(req, res, next) {
            var user = res.locals.user;
            if (user && user.admin) {
                return Exclusion.all().exec(function(err, exclusions) {
                    res.locals.exclusions = exclusions;
                    next();
                });
            }
            res.locals.exclusions = [];
            next();
        },

        checkPossible: function(req, res, next) {
            var user = res.locals.user;
            if (user && user.admin) {
                res.locals.possible = !!solver(res.locals.users);
            }
            next();
        }
    };
};
