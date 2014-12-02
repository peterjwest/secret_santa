module.exports = function(sendgrid) {
    var sendEmail = function(email, subject, body) {
        sendgrid.send({
            to: email,
            from: 'secret-santa@knights-of-ni.co.uk',
            subject: subject,
            text: body
        }, function(err, json) { return err ? console.error(err) : console.log(json); });
    };

    return {
        welcome: function(user) {
            sendEmail(
                user.email,
                'Welcome to KON Secret Santa',
                'To verify your account, copy this code to the site: '+user.verifyCode
            );
        },

        launch: function(giver, recipient) {
            sendEmail(
                giver.email,
                'Your KON Secret Santa is...',
                'Ho ho ho! Your secret santa is: '+recipient.name
            );
        }
    };
};
