

// Nodejs encryption with CTR
var crypto = require('crypto');
var algorithm = 'aes-256-cbc';
var password = 'yopay@)!&';
var iv = new Buffer.alloc(16); // fill with zeros
var key = crypto.createHash("sha256").update(password).digest();
var CryptoHelper = {};

module.exports = CryptoHelper ;

module.exports.encrypt = function (text){
    //return crypto.createCipheriv('aes-128-cbc', key, iv)
    var encipher = crypto.createCipheriv('aes-256-cbc', key, iv),
    encryptdata  = encipher.update(text, 'utf8', 'binary');
    encryptdata += encipher.final('binary');
    // encode_encryptdata = new Buffer(encryptdata, 'binary').toString('base64');
    return encryptdata;
}
 
module.exports.decrypt = function (text){
    // var encryptdata = new Buffer(text, 'base64').toString('binary');
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv),
    decoded  = decipher.update(text, 'binary', 'utf8');
    decoded += decipher.final('utf-8');
    return decoded;
}