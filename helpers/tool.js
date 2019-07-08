var Tool = {};
module.exports = Tool;

module.exports.RegularUsername = function (str) {
    // $pattern = "/^[a-z0-9_\.]{6,32}$/";
    if(!str)
        return  {status: false, mes : "please enter username"};
    var pattern = /^[a-z0-9_]{6,32}$/;
    var match = pattern.test(str);
    if ( ! match) {
        return  {status: false, mes : "Username from 6 - 32  alphanumeric characters and '_'"};
    }
    return {status:true, mes: ""};
}

module.exports.RegularPassword = function (str) {
    //      (/^
    //     (?=.*\d)                //should contain at least one digit
    //     (?=.*[a-z])             //should contain at least one lower case
    //     (?=.*[A-Z])             //should contain at least one upper case
    //     [a-zA-Z0-9]{8,}         //should contain at least 8 from the mentioned characters
    //     $/)
    var pattern = /^(?=.{6,})/;
    var match = pattern.test(str);
    if ( ! match) {
        return  {status: false, mes : "Passsword at least 6 characters"};
    }
    return {status:true, mes: ""};
}

module.exports.randomStr = function (length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

module.exports.change_alias = function (alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
    str = str.replace(/ + /g," ");
    str = str.replace(/ /g,"-");
    str = str.trim(); 
    return str;
}

module.exports.getUniqueNameKey = function (nameKey, value, model, callback) {
    model.findOne({nameKey : value}).exec(function(err, result){
        if(!result){
            callback(value);
        }else{
            value += '-' + Tool.randomStr(9);
            Tool.getUniqueNameKey(nameKey, value, model, callback);
        }
    })
}