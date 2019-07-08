// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var Config = new Schema ({
    name: String, 
    data: Object
});
var Config = mongoose.model('Config', Config);
module.exports = Config ;

module.exports.Add = function(item, callback){
    var item = new Config({
        name : item.name,
        data : item.data
    });

    item.save(function(err, result) {
		if (err) {
            callback({status: false, id: null});
			throw err;
		}
		else {
            console.log(result);
			callback({status : true, id: result.id});
		}
	});
}

module.exports.GetConfigByName = function(str, callback){
    Config.findOne({name : str}, function(err, finded){
        if(err || !finded){
            callback({status:false, config: null})
        }else{
            callback({status:true, config : finded._doc});
        }
    })
}

module.exports.GetConfigByID = function(str, callback){
    Config.findOne({_id : str}, function(err, finded){
        if(err || !finded){
            callback({status:false, config: null})
        }else{
            callback({status:true, config : finded._doc});
        }
    })
}