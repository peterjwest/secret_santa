var giverRecipients = function(users) {
    return users.map(function(user) {
        return {
            user: user,
            recipients: users.filter(function(u) {
                return user._id != u._id && user.allowsUser(u);
            })
        };
    });
};

var sortGivers = function(givers) {
    return givers.sort(function(a, b) {
        return b.recipients.length - a.recipients.length;
    });
};

var chooseRandom = function(array) {
    return array[Math.floor(Math.random() * array.length)];
};

var removeRecipient = function(recipient) {
    return function(giver) {
        giver.recipients = giver.recipients.filter(function(user) {
            return recipient._id != user._id
        });
    }
}

module.exports = function(users) {
    var givers = giverRecipients(users);
    var solution = [];
    var giver, recipient;

    while (givers.length > 0) {
        givers = sortGivers(givers);
        giver = givers.pop();
        if (giver.recipients.length == 0) break;

        recipient = chooseRandom(giver.recipients);
        givers.map(removeRecipient(recipient));
        solution.push({giver: giver.user, recipient: recipient});
    }

    return solution.length == users.length ? solution : null;
};
