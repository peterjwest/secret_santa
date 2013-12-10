var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

var randomChar = function() {
    return characters.charAt(Math.floor(Math.random() * characters.length));
};

var randomCode = function(length) {
    return length <= 0 ? '' : randomChar() + randomCode(length - 1);
};

module.exports = randomCode;
