// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
var OrderBook = new Schema ({
    idUser : Schema.Types.ObjectId,
    btcAmount : Number,
    btcRate : Number,
    usdRate : Number,
    vncAmount : Number,
    type: { type: String,  required: true },
    datecreate :  { type : Date, default: Date.now },
    status : Number,
});
var OrderBook = mongoose.model('OrderBook', OrderBook);
module.exports = OrderBook ;

module.exports.Add = function(item, callback){
    var item = new OrderBook({
        idUser : item.idUser,
        btcAmount : item.btcAmount,
        btcRate : item.btcRate,
        usdRate : item.usdRate,
        vncAmount : item.vncAmount,
        type : item.type,
        datecreate : item.datecreate,
        status : 0
    });

    item.save(function(err, result) {
		if (err) {
            callback({status: false, data: null});
			throw err;
		}
		else {
			callback({status : true, data: result._doc});
		}
	});


}

module.exports.UpdateOrderBook = function (id, setField, callback){
	var query = {
		_id : id,
	};
	OrderBook.update(query, setField, {upsert: true}, function(err, up){
		callback({err, up});
	})
}