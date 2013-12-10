module.exports = function(User) {
    return {
        users: function(req, res, next) {
            User.all(function(err, users) {
                res.locals.users = users;
                next();
            });
        }
    };
};
