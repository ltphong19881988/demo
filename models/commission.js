// get an instance of mongoose and mongoose.Schema
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
// var config = require('./../config'); // get our config file
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var CommissionSchema = new Schema ({
    amount: Number,
    idUser: Schema.Types.ObjectId, 
    idUserIncurred : Schema.Types.ObjectId, 
    type: String,           // transfer
    coinTransfer: String,   // BTC, ETH, VNC
    coinTransferAmount : Number,
    datecreate : { type : Date, default: Date.now },
    coinPrice : Number,
    idLendingPackage : { type: Schema.Types.ObjectId, ref: 'LendingPackage' },
    idLending : { type: Schema.Types.ObjectId},
    txid : String,
    source : String,
    receiver : String,
});
var Commission = mongoose.model('Commission', CommissionSchema);
module.exports = Commission ;

module.exports.Add = function(item, callback){
    var commission = new Commission({
        amount: item.amount,
        idUser: item.idUser, 
        idUserIncurred : item.idUserIncurred,
        type: item.type,           // transfer , direct, ...
        coinTransfer: item.coinTransfer,   // BTC, ETH, VNC
        coinTransferAmount : item.coinTransferAmount,
        datecreate : item.datecreate,
        coinPrice : item.coinPrice,
        idLendingPackage : item.idLendingPackage,
        idLending : item.idLending,
        txid : item.txid,
        source : item.source,
        receiver : item.usernameReceived,
    });

    commission.save(function(err, result) {
		if (err) {
            callback({status: false, result : err});
			//throw err;
		}
		else {
            callback({status : true, result});
		}
	});
}

