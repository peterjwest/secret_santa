var parser = require('url').parse;

module.exports = function(url) {
    if (!url) return {};

    var data = parser(url);
    return {
        port: data.port,
        host: data.hostname,
        pass: data.auth.split(':')[1]
    };
};
