var solver = require('../lib/solver');

module.exports = function(User, Exclusion, Round, Participant) {
    return {
        round: function(req, res, next) {
            Round.current(function(err, round) {
                res.locals.round = round;
                next();
            });
        },

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
                res.locals.possible = !!solver(res.locals.round.users());
            }
            next();
        },

        participate: function(req, res, next) {
            var user = res.locals.user;
            var round = res.locals.round;

            if (user.participating(round)) {
                return next();
            }

            var participant = new Participant({user: user, round: round});
            participant.save(function(err) {
                round.participants.push(participant);
                round.save(function(err) {
                    user.participant = participant;
                    user.save(function(err) {
                        next();
                    });
                });
            });
        }
    };
};
