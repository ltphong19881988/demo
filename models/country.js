// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var Country = new Schema ({
    alpha2Code : { type: String},
    callingCodes : [String],
    currencies : [],
    flag : String,
    name: { type: String},
    nativeName : {type : String},
    timezones : [],
});
Country.index({name : 1 , alpha2Code : 1}, {name: "countryIndex", unique: true});
var Country = mongoose.model('Country', Country);
module.exports = Country ;

module.exports.Add = function(item, callback){
	var cate = new Country({
		alpha2Code : item.alpha2Code,
        callingCodes : item.callingCodes,
        currencies : item.currencies,
        flag : item.flag,
        name: item.name,
        nativeName : item.nativeName,
        timezones : item.timezones,
	});

	cate.save(function(err, result){
		if(err){
			callback({status : false, mes : err});
		}else{
			callback({status : true, mes : 'add Country successfully', result : result});
		}
	});
	
}

module.exports.Update = function(id, setFields, callback){
	var query = {
		_id : id,
	};
	Country.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update Country successfully'})
	})
}

module.exports.Delete = function(id, callback){
	Country.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete Country successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}
