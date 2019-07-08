// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// set up a mongoose model and pass it using module.exports
var UserInvest = new Schema ({
    idUser: { type: Schema.Types.ObjectId, ref: 'User' }, 
	idInvestmentPackage: { type: Schema.Types.ObjectId, ref: 'InvestmentPackage' }, 
	amount : Number,
    datecreate :  { type : Date, default: Date.now },
});
UserInvest.index({idUser : 1 , idInvestmentPackage : 1, datecreate : 1}, {name: "UserInvestIndex", unique: true});
var UserInvest = mongoose.model('UserInvest', UserInvest);
module.exports = UserInvest ;

module.exports.Add = function(item, callback){
    var item = new UserInvest({
        idUser : item.idUser,
        idInvestmentPackage : item.idInvestmentPackage,
        amount : item.amount,
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
	UserInvest.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update UserInvest successfully'})
	})
}

module.exports.Delete = function(id, callback){
	UserInvest.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete UserInvest successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}
