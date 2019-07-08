var ip = require("ip").address();
var publicPath =  ''; 
var databaseCF = {
    connectStr : 'mongodb://139.180.135.76:27017/xxx-vncoins-vn', 
    user : 'tocvn', 
    pass: 'tocvn!@#@123'
}
if(ip == '139.180.135.76'){
    databaseCF = {
        connectStr : 'mongodb://139.180.135.76:27017/xxx-vncoins-vn', 
        user : 'tocvn', 
        pass: 'tocvn!@#@123'
    }
    publicPath = '/root/home/demo/';
}


module.exports = {
    fcmKey : 'AAAAyNKgGwg:APA91bGDhrIXPvI7chnyynRg5aKmDtDFT6xYhZF5l1ierwW-MPtdkullvdOotpa3byGlzHVxY6gRa_ZQsZ92BzH6OJICU3astb5LDtNUvjQIsyehmfzPsGTFgoajjtqzO837nwWwErad',
    'serverSeed' : '1199932bf7dbcea2030fa899f6f591bd09511a49857a67134ab384d7c6fba4a5',
    'clientSeed' : '000000000000000007a9a31ff7f07463d91af6b5454241d5faf282e5e0fe1b3a',
    'secret': 'alluneedev',
    'database': databaseCF,
    'publicPath' : publicPath,
    'allowIP' : '127.0.0.1',
    'reCaptchaKey' : '6LeQNjsUAAAAAODIAq8fxuXiLHwtLuAoIuy2LnfT',
    'reCaptchaKSecrect' : '6LeQNjsUAAAAAMQMspip8e39YQEcC8jKxIOq6Vhp',
    'reCaptchaKeyLocal' : '6LfXNjsUAAAAAOPfroYZRzkZTlhKhjTxMQWC3ykd',
    'reCaptchaKSecrectLocal' : '6LfXNjsUAAAAABRRFz1eZ5Ujx85voFdBFom6bo8E',
    coinBase : {
        'apiKey': '3ToD8MLLtPaj40b2', 
        'apiSecret': '3B1fHPii0s0pj8JMl3sRBEBBPA4zSYjp',
        id : "7d51c73a-4d31-586a-b206-550c9de0ed08",
        email : "phongle@vultr.com.vn",
        btcAccount : {
            id : "1f0b3403-199f-594c-a271-221d50388895"
        },
        ethAccount : {
            id : "f66d9aa0-b723-5bf2-8b48-76ca41c5b737"
        },
    }
    
};

