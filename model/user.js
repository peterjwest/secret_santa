var validate = require('mongoose-validate');
var bcrypt = require('bcrypt');
var crypt = require('../lib/crypt');

var formatErrors = function(err) {
    return err && err.errors ? Object.keys(err.errors).map(function(key) {
        return err.errors[key].type;
    }) : [];
};

module.exports = function(mongoose, emailer, verifyCode) {
    var UserSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true,
            index: { unique: true },
            validate: [validate.email, "That's not even a real email address"]
        },
        name: { type: String, required: true, index: { unique: true } },
        password: { type: String, required: true },
        key: { private: { type: String }, public: { type: String } },
        verifyCode: { type: String },
        lastAttempt: { type: Date },
        ip: { type: String },
        verified: { type: Boolean, default: false },
        participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
        exclusions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exclusion' }]
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

    UserSchema.virtual('locked').get(function() {
        return this.lastAttempt && this.lastAttempt + 3000 > Date.now();
    });

    UserSchema.methods.allowsUser = function(user) {
        if (this._id == user._id) return false;
        return this.exclusions.filter(function(e) {
            return e.users.filter(function(u) {
                return u.equals(user._id);
            }).length > 0;
        }).length == 0;
    };

    UserSchema.methods.encryptSanta = function(santa) {
        return crypt.encrypt(this.key.public, santa);
    };

    UserSchema.methods.decryptSanta = function(password) {
        return crypt.decrypt(this.key.private, password, this.participant.santa);
    };

    UserSchema.methods.unlockSanta = function(password, next) {
        var user = this;
        user.comparePassword(password, function(err, match) {
            if (err) return next(err);
            if (!match) return next("Password incorrect");
            if (!user.participant.santa) return next("User does not have a secret santa");
            next(null, user.decryptSanta(password));
        });
    };

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

    UserSchema.methods.assignSanta = function(santa, next) {
        emailer.launch(this, santa);
        this.participant.santa = this.encryptSanta(santa.name);
        this.participant.save(function(err) {
            next();
        });
    };

    UserSchema.methods.participating = function(round) {
        return !!(this.participant && this.participant.round.equals(round._id));
    };

    UserSchema.statics.authenticate = function(details, next) {
        var loginError = 'Either your username or password was wrong';
         var Model = this.model('User');
        this.findOne({ email: details.email }, function(err, user) {
            if (err) return next(err);
            if (!user || user.locked) return next([loginError], null);

            user.comparePassword(details.password, function(err, match) {
                if (err) return next(err);
                if (match) {
                    return Model.populate(user, 'pariticpant', function(err) {
                        if (err) return next(err);
                        return next(null, user);
                    });
                }
                next([loginError], null);
            });
        });
    };

    UserSchema.statics.create = function(details, next) {
        var registerError = "You can't register with that name or email";
        var Model = this.model('User');
        this.findOne({ $or: [{email: details.email}, {name: details.name}] }, function(err, user) {
            if (err) return next(err);
            if (user) return next([registerError], null);

            var user = new Model;
            user.name = details.name;
            user.email = details.email;
            user.password = details.password;
            user.verifyCode = verifyCode(9);

            crypt.generateKeyPair(user.password, function(key) {
                user.key = key;
                user.save(function(err) {
                    if (err) return next(formatErrors(err));

                    emailer.welcome(user);
                    next(null, user);
                });
            });
        });
    };

    UserSchema.statics.all = function() {
        return this.find({verified: true}).populate('exclusions');
    };

    UserSchema.statics.addExclusion = function(users, exclusion, next) {
        var update = {$push: {exclusions: exclusion}};
        this.update({_id: {$in: users}}, update, {multi: true}, function(err) {
            next(err);
        });
    };

    UserSchema.statics.removeExclusion = function(exclusion, next) {
        var update = {$pull: {exclusions: exclusion}};
        this.update({}, update, {multi: true}, function(err) {
            next(err);
        });
    };

    var User = mongoose.model('User', UserSchema);

    return User;
};
