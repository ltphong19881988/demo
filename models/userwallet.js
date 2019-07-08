// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var UserWallet = new Schema ({
    idUser: { type: Schema.Types.ObjectId, ref: 'User' }, 
    idCurrency: { type: Schema.Types.ObjectId, ref: 'Currency' }, 
    data : {},
    datecreate :  { type : Date, default: Date.now },
});
UserWallet.index({idUser : 1 , idCurrency : 1}, {name: "userWalletIndex", unique: true});
var UserWallet = mongoose.model('UserWallet', UserWallet);
module.exports = UserWallet ;

module.exports.Add = function(item, callback){
    var item = new UserWallet({
        idUser : item.idUser,
        idCurrency : item.idCurrency,
        data : item.data,
        datecreate : item.datecreate
    });

    item.save(function(err, result) {
		if (err) {
            callback({status: false, result: null});
			// throw err;
		}
		else {
			callback({status : true, result: result});
		}
	});

}

module.exports.Update = function(id, setFields, callback){
	var query = {
		_id : id,
	};
	UserWallet.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update UserWallet successfully'})
	})
}

module.exports.Delete = function(id, callback){
	UserWallet.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete UserWallet successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}
