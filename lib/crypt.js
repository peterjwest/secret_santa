var cp = require('child_process');
var ursa = require('ursa');

var crypt = {
    generatePrivateKey: function(next) {
        var terminal = cp.spawn('openssl', ['genrsa', '2048']);
        terminal.stdout.on('data', function(data) {
            next(data);
        });
    },

    publicKey: function(privateKey, next) {
        var terminal = cp.spawn('openssl', ['rsa', '-outform', 'PEM', '-pubout']);
        terminal.stdin.write(privateKey);
        terminal.stdout.on('data', function(publicKey) {
            next(publicKey);
        });
    },

    encryptKey: function(privateKey, password, next) {
        var terminal = cp.spawn('openssl', ['pkcs8', '-topk8', '-v2', 'des3', '-passout', 'pass:'+password]);
        terminal.stdin.write(privateKey);
        terminal.stdout.on('data', function(encryptedKey) {
            next(encryptedKey);
        });
    },

    generateKeyPair: function(password, next) {
        crypt.generatePrivateKey(function(privateKey) {
            crypt.publicKey(privateKey, function(publicKey) {
                crypt.encryptKey(privateKey, password, function(encryptedKey) {
                    next({public: publicKey.toString('utf8'), private: encryptedKey.toString('utf8')});
                });
            });
        });
    },

    encrypt: function(publicKey, data) {
        var key = ursa.createPublicKey(publicKey);
        return key.encrypt(data).toString('base64');
    },

    decrypt: function(privateKey, password, data) {
        try {
            var key = ursa.createPrivateKey(privateKey, password);
        }
        catch (e) { return null; }
        return key.decrypt(data, 'base64', 'utf8');
    }
};

module.exports = crypt;
