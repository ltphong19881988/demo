// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var Currency = new Schema ({
    pair: { type: String, unique: true, required: true },
    name: { type: String, required: true }, 
	img : String,
	curPrice : Number,
    datecreate :  { type : Date, default: Date.now },
});
var Currency = mongoose.model('Currency', Currency);
module.exports = Currency ;

module.exports.Add = function(item, callback){
    var item = new Currency({
        pair : item.pair,
        name : item.name,
		img : item.img,
		curPrice : item.curPrice,
        datecreate : item.datecreate
    });

    item.save(function(err, result) {
		if (err) {
            callback({status: false, id: null});
			throw err;
		}
		else {
			callback({status : true, id: result.id});
		}
	});

}

module.exports.Update = function(id, setFields, callback){
	var query = {
		_id : id,
	};
	Currency.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update Currency successfully'})
	})
}

module.exports.Delete = function(id, callback){
	Currency.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete Currency successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}
