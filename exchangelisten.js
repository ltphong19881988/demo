
var socketIo = require('socket.io');
var socketioJwt = require('socketio-jwt');
var async = require('async');
var moment = require('moment');
var OrderBook = require('./models/orderbook');
var TradeHistory = require('./models/tradehistory');
var User   = require('./models/user');

var ExchangeListen = {}
module.exports = ExchangeListen;


var curUsdRate = 4;
var curBtcRate = 0.001;
var processing = false;


module.exports.Init = function(sio){
    sio.sockets
    .on('connection', socketioJwt.authorize({
      secret: 'alluneedev',
      timeout: 15000 // 15 seconds to send the authentication message
    })).on('authenticated', function(socket) {
      //this socket is authenticated, we are good to handle more events from it.
        //console.log('hello! ' , socket.decoded_token);
        // socket.on('create-buy-order', function(data){
        //     console.log('count', sio.engine.clientsCount);
        //     var item = new OrderBook({
        //         idUser : socket.decoded_token._id,
        //         btcAmount : parseFloat(data['buy-offer-quantity']),
        //         btcRate : parseFloat(data['buy-price']),
        //         // usdRate : item.usdRate,
        //         vncAmount : parseFloat(data['buy-want-quantity']),
        //         type : 'buy',
        //         datecreate : moment().format()
        //     });

            
            
            
        // })

        socket.on('disconnect', function () {
            //Useful to know when someone disconnects
            console.log('\t socket.io:: client disconnected ' , socket.decoded_token );
            // io.emit("disconnected",client.user_name);
        });


    });



    //         //console.log(socket.client.request.decoded_token);
    //         socket.on("messenger", function( mes){  
    //             auth.CheckToken(socket.client.request._query.token, function(result){
    //                 if(result.status == true && mes != "" && mes != null){                    
    //                     var date = new Date();
                        
    //                     var data = {
    //                         username: result.decoded._doc.username,
    //                         mes: mes,
    //                         time: date.getHours() + ':' + date.getMinutes()
    //                     };
    //                     sio.emit('messenger', data);
    //                 }
    //             });
    //             //console.log(auth.Dark(socket.client.request._query.token));
    //         })

    //         socket.on('disconnect', function(socket) {
    //             // console.log('Got disconnect!');
    //             // var i = allClients.indexOf(socket);
    //             // allClients.splice(i, 1);
    //         });
    // });

    module.exports.CreateBuyOrder = function(data){
        console.log(data);
        sio.emit('create-buy-order', data);
    }

    module.exports.CreateSellOrder = function(data){
        console.log(data);
        sio.emit('create-sell-order', data);
    }

    ProcessOderBook();
};

function ProcessOderBook(){
    if(!processing){
        //processing = true;
        async.parallel({
            orderBuy : function(callback){
                OrderBook.findOne({type : 'buy', status : 0}).sort({btcRate: -1, datecreate : 1}).exec(function(err, result) {
                    // listBuy.forEach(element => {
                    //     console.log(element.btcRate +  " == " + element.datecreate);
                    // });
                    
                    callback(null, result);
                });
            },
            orderSell : function(callback){
                OrderBook.findOne({type : 'sell', status : 0}).sort({btcRate: 1, datecreate : 1}).exec(function(err, result) {
                    // listBuy.forEach(element => {
                    //     console.log(element.btcRate +  " == " + element.datecreate);
                    // });
                    // console.log(err, result);
                    callback(null, result);
                });
            },
            lastTH : function(callback){
                TradeHistory.findOne({}).sort({datecreate : 1}).exec(function(err, result){
                    // console.log(err, result);
                    callback(null, result);
                })
            },
        },function(err, results){
            if(results.lastTH != null){
                curBtcRate = results.lastTH.btcRate;
            }
            if(results.orderBuy != null && results.orderSell != null){
                if(results.orderBuy.btcRate >= results.orderSell.btcRate){
                    var rateMatch = results.orderBuy.btcRate < curBtcRate ? results.orderBuy.btcRate : results.orderSell.btcRate ;
                    var tradehistory =  {
                        idBuy : results.orderBuy._id,
                        idSell : results.orderSell._id,
                        idBuyer : results.orderBuy.idUser,
                        idSell : results.orderSell.idUser,
                        btcAmount : results.orderBuy.btcAmount < results.orderSell.btcAmount ? results.orderBuy.btcAmount : results.orderSell.btcAmount,
                        btcRate : rateMatch ,
                        // usdRate : item.usdRate,
                        vncAmount : results.orderBuy.vncAmount < results.orderSell.vncAmount ? results.orderBuy.vncAmount : results.orderSell.vncAmount,
                        type : curBtcRate < rateMatch ? 'buy' : 'sell',
                        datecreate : moment().format()
                    }

                    TradeHistory.Add(tradehistory, function(result){
                        if(result.status){
                            var buyBtcAmount = results.orderBuy.btcAmount - tradehistory.btcAmount;
                            var buyField = {btcAmount : buyBtcAmount, vncAmount : buyBtcAmount/tradehistory.btcRate, status : 0};
                            if(buyBtcAmount == 0){
                                buyField.status = 1;
                            }
                            OrderBook.UpdateOrderBook(results.orderBuy._id, buyField, function(abc){
                                if(abc.err == null){
                                    var userField
                                }
                                // Server send modify to client
                            })

                            var sellBtcAmount = results.orderSell.btcAmount - tradehistory.btcAmount;
                            var sellField = {btcAmount : sellBtcAmount, vncAmount : sellBtcAmount/tradehistory.btcRate, status : 0};
                            if(sellBtcAmount == 0){
                                sellField.status = 1;
                            }
                            OrderBook.UpdateOrderBook(results.orderSell._id, sellField, function(abc){
                                // Server send modify to client
                            })
                        }
                    })

                }else{
                    console.log('not match');
                    processing = false;
                    setTimeout(function(){
                        ProcessOderBook();
                    }, 5000);
                }
            }else{
                console.log('no thing to process');
                processing = false;
                setTimeout(function(){
                    ProcessOderBook();
                }, 5000);
            }
        });
        
    }
}


function setUserFree(id, status, callback){
    var query = {
        _id : id,
    };
    var setField = {$set: { free : status}};
    User.update(query, setField, {upsert: true}, function(err, up){
        console.log(err, up);
        callback();
    })
}

function randomNumberFromRange(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function timer(sio)
{
    var num = randomNumberFromRange(1,99);
    while(serverLotoNumber.indexOf(num) > -1){
        num = randomNumberFromRange(1,99);
    }
    serverLotoNumber.push(num);
    serverLotoNumber.sort();    
    //Do code for showing the number of seconds here
    sio.emit("gen-num", num); // watch for      spelling

    for(var i = 0; i < listUserBet.length ; i++){
        if(listUserBet[i].listnumber.indexOf(num) > -1){
            listUserBet[i].listnumber.splice( listUserBet[i].listnumber.indexOf(num), 1 );
        }
        if(listUserBet[i].listnumber.length == 0){
            listWinner.push(listUserBet[i].username);
        }
    }

    if (listWinner.length > 0)
    {
        console.log(listWinner);
        sio.emit("loto-winner", listWinner); // watch for      spelling
        refreshCashOut = setInterval(serverCashOut, 1000, sio);
        listUserBet.length = 0;
        listWinner.length = 0;
        serverLotoNumber.length = 0;
        return;
    }else{
        setTimeout(timer, 1000, sio);
    }
    
}


// db.createUser(
//     {
//       user: "user1",
//       pwd: "admin123456",
//       roles: ["readWrite", "dbAdmin"]
//     }
// )