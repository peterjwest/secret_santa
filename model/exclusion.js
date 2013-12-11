module.exports = function(mongoose) {
    var ExclusionSchema = new mongoose.Schema({
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    });

    ExclusionSchema.statics.create = function(users, next) {
        var User = this.model('User');
        if (users.length != 2) return next('Exclusions must include two people');

        this.existing(users, function(err, existing) {
            if (err) return next(err);
            if (existing) return next('Exclusion already exists');

            var exclusion = new Exclusion;
            exclusion.users = users;
            exclusion.save(function(err) {
                if (err) return next(err);
                User.addExclusion(users, exclusion, function(err) {
                    if (err) next(err);
                    next(null, exclusion);
                })
            });
        });
    };

    ExclusionSchema.statics.existing = function(users, next) {
        this.findOne({ users: users }, function(err, exclusion) {
            if (err) return next(err);
            next(null, exclusion);
        });
    };

    ExclusionSchema.statics.all = function() {
        return this.find().populate('users');
    };

    var Exclusion = mongoose.model('Exclusion', ExclusionSchema);

    return Exclusion;
};
