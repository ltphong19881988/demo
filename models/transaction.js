// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var Transaction = new Schema ({
	source: String,				// plus, minus
	method: { type: String,  required: true },        // buy, sell, deposit, withdraw, send, get, fee, commission, invest
	methodType: { type: String,  required: true },        // if commission we have many type
	walletType : String,        // btc or eth
	walletAmount : Number,
	idUser : Schema.Types.ObjectId,
	idUserIncurred : Schema.Types.ObjectId,
    address : String,           // address of btc or vnc
    amount : Number,
    datecreate :  { type : Date, default : Date.now},
    status : Number,            // -1 cancel, 0 pending, 1 approved
	txid : String,
	idHistory : Schema.Types.ObjectId,
	description : String,
	real : { type : Boolean, default : true}
});
var Transaction = mongoose.model('Transaction', Transaction);
module.exports = Transaction ;

module.exports.Add = function(item, callback){
    var Trans = new Transaction({
		source : item.source,
		method : item.method,
		methodType : item.methodType,
		walletType : item.walletType,        // btc or vnc
		walletAmount : item.walletAmount,        
		idUser : item.idUser,
		idUserIncurred : item.idUserIncurred,
		address : item.address,
		amount : item.amount,
		datecreate :  item.datecreate,
		status : item.status,
		txid : item.txid,
        idHistory : item.idHistory,
		description : item.description,
		real : item.real
    });

    Trans.save(function(err, result) {
		if (err) {
            callback({status: false, result: null});
			// throw err;
		}
		else {
            //console.log(result);
			callback({status : true, result});
		}
	});

}

module.exports.Update = function(id, setFields, callback){
	var query = {
		_id : id,
	};
	Transaction.update(query, setField, {upsert: true}, function(err, up){
		if(err)
			callback({status : false, mes : err});
		callback({status : true, mes : 'update transaction successfully'})
	})
}

module.exports.Delete = function(id, callback){
	Transaction.remove({ _id : id }, function(err) {
		if (!err) {
			callback({status : true, mes : 'delete transaction successfully'});
		}
		else {
			callback({status : false, mes : err});
		}
	});
}

module.exports.GetTransactionsByIdUser = function(str, callback){
    Transaction.find({idUser : str}, function(err, transactions){
		if(err){
			// throw err;
			callback({status: false, transactions : []});
		}
		if(!transactions){
			callback({status: false, transactions});
		} else if (transactions){
			callback({status: true, transactions});
		}
	});
}

