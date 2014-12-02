module.exports = function(mongoose, moment) {
    var RoundSchema = new mongoose.Schema({
        started: { type: Boolean, default: false },
        year: { type: Number, default: function() { return moment().year(); } },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }]
    });

    RoundSchema.methods.decade = function() {
        return this.year.toString()[2];
    };

    RoundSchema.methods.yearUnit = function() {
        return this.year.toString()[3];
    };

    RoundSchema.methods.users = function() {
        return this.participants.map(function(participant) {
            return participant.user;
        });
    };

    RoundSchema.statics.current = function(next) {
        var Round = this.model('Round');
        var Participant = this.model('Participant');
        var Exclusion = this.model('Exclusion');

        return this.where('year')
            .equals(moment().year())
            .populate('participants')
            .findOne(function(err, year) {
                if (err) return next(err);

                if (year) {
                    return Participant.populate(year.participants, { path: 'user' }, function(err) {
                        var users = year.participants.map(function(participant) { return participant.user; });
                        Exclusion.populate(users, { path: 'exclusions' }, function(err) {
                            return next(err, year);
                        });
                    });
                }

                year = new Round();
                year.save(function(err) {
                    if (err) return next(err);
                    return next(err, year);
                });
            });
    };

    return mongoose.model('Round', RoundSchema);
};
