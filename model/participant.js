module.exports = function(mongoose) {
    var ParticipantSchema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        round: { type: mongoose.Schema.Types.ObjectId, ref: 'Round' },
        santa: { type: String }
    });

    return mongoose.model('Participant', ParticipantSchema);
};
