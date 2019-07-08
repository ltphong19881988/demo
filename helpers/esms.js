var moment = require('moment');
var request = require('request');

var dayname = {
    en :['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    vi : ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
};
var baseUrl = "http://rest.esms.vn/MainService.svc/json/";
var Apikey = '48586E9E5EFCB5049CAFE86CBFE3EC';
var Secretkey = '625D1FB767B1986E74EF6BF3D541F3';
var Esms = {};

module.exports = Esms ;

module.exports.GetBalance = function (callback){
    request({
        url: baseUrl + 'GetBalance/' + Apikey + '/' + Secretkey,
        json: true
    }, function(error, response, body) {
        callback(body);
    });
}

module.exports.GetBalance = function (callback){
    request({
        url: baseUrl + 'GetBalance/' + Apikey + '/' + Secretkey,
        json: true
    }, function(error, response, body) {
        callback(body);
    });
}

module.exports.SendMessage = function (phone, content, smsType, callback){
    request({
        url: baseUrl + 'SendMultipleMessage_V4_get?Phone=' + phone + '&Content=' + content + '&ApiKey=' + Apikey + '&SecretKey=' + Secretkey + '&SmsType=' + smsType,
    }, function(error, response, body) {
        // console.log('fun', response, body);
        callback(JSON.parse(body));
    });
}


//var Esms = require('./helpers/esms');
// Esms.GetBalance(function(result){
//     console.log(result);
// })

// Esms.SendMessage('0938215268', 'chao ban', 6, function(result){
//     console.log(result);
// })
