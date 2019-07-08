
var myApp = angular.module("adminApp", ["ngRoute", 'ui.bootstrap']);
var listBuyOrder = [];
var listSellOrder = [];

// var tablebuyOrder = $('#buyOrder').DataTable({
//     "order": [[ 1, "desc" ]]
// });

// myApp.config([
//     '$routeProvider', function ($routeProvider) {
//          $routeProvider
//             .when('/user/index', {
//                 title: 'User profile',
//             });
//     }
// ]);

// myApp.run(['$rootScope', '$route', function($rootScope, $route) {
//     $rootScope.$on('$routeChangeSuccess', function() {
//         document.title = $route.current.title;
//     });
// }]);

function AjaxLoad($http, url, type, data, callback){
    $http({
        url: url,
        method: type,
        data: data
    }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
            callback(response);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            // $scope.error = response.statusText;
    });
}

function SetIcoEndTime($scope){
    var endDay = moment($scope.icoInfo.endDay).toDate().getTime();
    var curNow = moment().toDate().getTime();
    var days = parseInt((endDay - curNow) / (1000*60*60*24));
    var hours = parseInt((endDay - curNow - days*1000*60*60*24) / (1000*60*60));
    var mins = parseInt((endDay - curNow - days*1000*60*60*24 - hours*1000*60*60) / (1000*60));
    var secs = parseInt((endDay - curNow - days*1000*60*60*24 - hours*1000*60*60 - mins*1000*60) / (1000));
    $("#days").html(days);
    $("#hours").html(hours);
    $("#mins").html(mins);
    $("#secs").html(secs);
    
}

function SetIcoNextRound ($scope){
    var ndays = parseInt(($scope.nextRound)/(1000*60*60*24));
    var nhours = parseInt(($scope.nextRound - ndays*1000*60*60*24) / (1000*60*60));
    var nmins = parseInt(($scope.nextRound - ndays*1000*60*60*24 - nhours*1000*60*60) / (1000*60));
    var nsecs = parseInt(($scope.nextRound - ndays*1000*60*60*24 - nhours*1000*60*60 - nmins*1000*60) / (1000));
    $("#ndays").html(ndays);
    $("#nhours").html(nhours);
    $("#nmins").html(nmins);
    $("#nsecs").html(nsecs);
}



function PaginationSellOrder( data){
    data.forEach(ele=>{
        ele.usdRate = ele.btcRate*14560;
    })
    $('#sellOrder').DataTable({
        data: data,
        "columns": [
            {'data': '_id', 'sType': 'string', "bVisible": true, "bSearchable": false},
            {'data': 'btcAmount', 'sType': 'number', "bVisible": true, "bSearchable": false},
            {'data': 'btcRate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            {'data': 'usdRate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            {'data': 'vncAmount', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            
            ]
        ,
        "order": [[ 2, "desc" ]],
        "initComplete": function( settings, json ) {
            $('#sellOrder tr th:first-child').hide();
            $('#sellOrder tr td:first-child').hide();
        }
    });
    
}


function PaginationBuyOrder( data){
    data.forEach(ele=>{
        ele.usdRate = ele.btcRate*14560;
    })
    $('#buyOrder').DataTable({
        data: data,
        "columns": [
            {'data': '_id', 'sType': 'string', "bVisible": true, "bSearchable": false},
            {'data': 'btcAmount', 'sType': 'number', "bVisible": true, "bSearchable": false},
            {'data': 'btcRate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            {'data': 'usdRate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            {'data': 'vncAmount', 'sType': 'string', 'bVisible': true, "bSearchable": true},
            
            ]
        ,
        "order": [[ 2, "desc" ]],
        "initComplete": function( settings, json ) {
            $('#buyOrder tr th:first-child').hide();
            $('#buyOrder tr td:first-child').hide();
        }
    });
    
}

(function(app){
    "use strict";

    app.controller("profileCtrl", function($scope, $http){
        $scope.profiletitle = "Your profile : ";
        $scope.title = "User profile page ";
        AjaxLoad($http, "/user/getuserinfo", 'GET', {token : curtoken}, function(data){
            // console.log(data);
            $scope.info = data.data;
            $scope.referalLink = $(location).attr('host') + '/register?ref=' + data.data.username;
        });
        AjaxLoad($http, "/lending/get-commission-balance", 'GET', {token : curtoken}, function(data){
            $scope.usdCommissionAmount = data.data.usdBalance;
        });
        AjaxLoad($http, "/lending/get-daily-balance", 'GET', {token : curtoken}, function(data){
            $scope.usdDailyAmount = data.data.usdBalance;
        });
        AjaxLoad($http, "/api/coin-price?currency=alls", 'GET', {}, function(data){
            var bitcoin, ethereum;
            data.data.filter(function(x){
                if(x.symbol == "BTC"){
                    $scope.bitcoin = x;
                }
                if(x.symbol == 'ETH'){
                    $scope.ethereum = x;
                }
                if(x.symbol == 'VNC'){
                    $scope.vncoins = x;
                }
            });
        });
    });

    app.controller("icoCtrl", function($scope, $http){
        AjaxLoad($http, "/ico/ico-info", 'GET', {token : curtoken}, function(data){
            //console.log(data.data);
            $scope.icoInfo = data.data.info;
            $scope.nextRound = data.data.nextRound;
            $("#icoPrice").html (data.data.curRound.price);
            // SetIcoTime($scope);
            var abc =  setInterval(function(){
                SetIcoEndTime($scope);
                // if($scope.nextRound <= 0){
                //     clearInterval(abc);
                // }
                
            }, 1000);
            var xyz =  setInterval(function(){
                $scope.nextRound -= 1000 ;
                SetIcoNextRound($scope);
                if($scope.nextRound <= 0){
                    clearInterval(xyz);
                    $("#nsecs").html(0);
                }
                
            }, 1000);
        });
            
    });

    app.controller("exchangeCtrl", function($scope, $http){
        AjaxLoad($http, "/exchange/getlistbuyorder", 'GET', {token : curtoken}, function(data){
            var listBuyOrder = data.data;
            // console.log(listBuyOrder);
            PaginationBuyOrder(listBuyOrder);
            socket.on('create-buy-order', function(data){
                listBuyOrder.push(data);
                $('#buyOrder').DataTable().destroy();
                PaginationBuyOrder(listBuyOrder);
            });
        });

        AjaxLoad($http, "/exchange/getlistsellorder", 'GET', {token : curtoken}, function(data){
            var listSellOrder = data.data;
            // console.log(listSellOrder);
            PaginationSellOrder(listSellOrder);
            socket.on('create-sell-order', function(data){
                listSellOrder.push(data);
                $('#sellOrder').DataTable().destroy();
                PaginationSellOrder(listSellOrder);
            });
        });
            
    });

    app.controller("walletCtrl", function($scope, $http){
        var abc = function(){
            if($('#vncAddress').val() == null || $('#vncAddress').val() == '' || $('#vncAddress').val() == '{{info.vncAddress}}'){
                setTimeout(() => {
                    //console.log($('#vncAddress').val());
                    abc();
                }, 2000);
            }else{
                $('#copyCoinTarget').html($('#vncAddress').val());
                $("#coinQRcode").qrcode({
                    text	:  $("#copyCoinTarget").html(),
                    size : 260,
                    background : '#fff'
                });
                $('#coinAmount').html($('#vncAmount').val())
                $('#walletType').prop('disabled', false);
                
            }
        }
        abc();
        $('#walletType').change(function(){
            $('#usdtovnd').html(''); $('input[name="vncAmount"]').val('');
            $('#copyCoinTarget').html($('#' + $(this).val() + 'Address').val());
            $('#coinAmount').html($('#'+ $(this).val() + 'Amount').val())
            $("#coinQRcode").html('');
            $("#coinQRcode").qrcode({
                text	:  $("#copyCoinTarget").html(),
                size : 260,
                background : '#fff'
            });
            $('#formWalletType').val($("#walletType :selected").val());
            if($("#walletType :selected").text().indexOf('USD') != -1){
                $('input[name="vncAddress"]').parent().parent().find('label').eq(0).html('Username nhận <span class="required">*</span>');
            }else{
                $('input[name="vncAddress"]').parent().parent().find('label').eq(0).html('Địa chỉ ví nhận <span class="required">*</span>');
            }
        })

        $('input[name="vncAmount"]').on('keyup',function(e){
            if($.isNumeric($(this).val()) && $("#walletType :selected").text().indexOf('USD') != -1){
                var vnd = parseFloat($(this).val()) * 22700 ;
                vnd = $.number( vnd) + ' VNĐ';
                $('#usdtovnd').html(vnd);
            }
            
        });
    });

    app.controller("transactionCtrl", function($scope, $http){
        AjaxLoad($http, "/transaction/gettransaction", 'GET', {token : curtoken}, function(data){
            data.data.vnc.forEach(ele=>{
                if(!ele.description)
                    ele.description = '';
                if(ele.status == -1){
                    ele.status = '<span>Canceled</span>';
                }else{
                    if(ele.status == 0){
                        ele.status = '<span>Pending</span>';
                    }else if(ele.status == 1){
                        ele.status = '<span>Finished</span>';
                    }
                }
            })
            var options = {
                data: data.data.vnc,
                "columns": [
                    {'title':'Date Create', 'data': 'datecreate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Type', 'data': 'type', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Amount', 'data': 'amount', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Status', 'data': 'status', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Description', 'data': 'description', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    ]
                ,
                "order": [[ 0, "desc" ]],
                "initComplete": function( settings, json ) {
                    $('.vncTransactions').eq(0).find('table').eq(0).css('width','100%');
                }
            };
            
            $('.vncTransactions').eq(0).find('table').eq(0).dataTable(options);
            data.data.btc.forEach(ele=>{
                if(!ele.description)
                    ele.description = '';
                if(ele.status == -1){
                    ele.status = '<span>Canceled</span>';
                }else{
                    if(ele.status == 0){
                        ele.status = '<span>Pending</span>';
                    }else if(ele.status == 1){
                        ele.status = '<span>Finished</span>';
                    }
                }
            })
            var optionsbtc = {
                data: data.data.btc,
                "columns": [
                    {'title':'Date Create', 'data': 'datecreate', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Type', 'data': 'type', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Amount', 'data': 'amount', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Status', 'data': 'status', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'title':'Description', 'data': 'description', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    ]
                ,
                "order": [[ 0, "desc" ]],
                "initComplete": function( settings, json ) {
                    $('.btcTransactions').eq(0).find('table').eq(0).css('width','100%');
                }
            };
            $('.btcTransactions').eq(0).find('table').eq(0).dataTable(optionsbtc);

        });
    });

    app.controller("lendingCtrl", function($scope, $http){
        $('title').html('Lending Page - Vncoins.vn')
        AjaxLoad($http, "/lending/getallpackages", 'GET', {token : curtoken}, function(data){
            // console.log(data);
            $scope.packages = data.data;
        });
        AjaxLoad($http, "/lending/get-lending-balance", 'GET', {token : curtoken}, function(data){
            $scope.usdBalance = data.data.usdBalance;
        });
        

        $('.transfer').click(function(){
            var str = $(this).attr('data').split('-');
            $('input[name="from"]').val(str[0]);
            $('input[name="to"]').val(str[1]);
            $('input[name="amount"]').focus();
        })

        $("#transferForm").submit(function(e){
            $("#transferForm .mes").html("").removeClass('alert-success').removeClass('alert-danger').hide();
            var data = $(this).serialize();
            $.ajax({
                url: "/lending/transfer",
                data: data,
                type: "POST",
                success: function (result) {
                    $("#transferForm .mes").html(result.mes);
                    if(result.status){
                        $("#transferForm .mes").addClass('alert-success').show();
                        AjaxLoad($http, "/lending/get-usd-balance", 'GET', {token : curtoken}, function(data){
                            $scope.usdBalance = data.data.usdBalance;
                        });
                        AjaxLoad($http, "/user/getuserinfo", 'GET', {token : curtoken}, function(data){
                            $scope.info = data.data;
                        });
                    }else{
                        $("#transferForm .mes").addClass('alert-danger').show();
                    }
                    restoreButton();
                }
            });
            e.preventDefault();
        });
        
        $("#lendingForm").submit(function(e){
            $("#lendingForm .mes").html("").removeClass('alert-success').removeClass('alert-danger').hide();
            var data = $(this).serialize();
            $.ajax({
                url: "/lending/create-lending",
                data: data,
                type: "POST",
                success: function (result) {
                    $("#lendingForm .mes").html(result.mes);
                    if(result.status){
                        $("#lendingForm .mes").addClass('alert-success').show();
                    }else{
                        $("#lendingForm .mes").addClass('alert-danger').show();
                    }
                    restoreButton();
                }
            });
            e.preventDefault();
        });
        
    });

    app.controller("dashboardCtrl", function($scope, $http){
        AjaxLoad($http, "/lending/my-all-packages", 'GET', {token : curtoken}, function(data){
            var allLendingPackages = data.data;
            allLendingPackages.forEach(ele=>{
                ele.amount = - ele.amount;
                if(ele.amount < 10000){
                    ele.dayend = moment(ele.datecreate).add(180, 'd');
                }
                if(ele.amount >= 10000 && ele.amount < 50000 ){
                    ele.dayend = moment(ele.datecreate).add(240, 'd');
                }
                if(ele.amount >= 50000 && ele.amount < 100000 ){
                    ele.dayend = moment(ele.datecreate).add(270, 'd');
                }
                if(ele.amount > 100000  ){
                    ele.dayend = moment(ele.datecreate).add(300, 'd');
                }
                ele.dayend = moment(ele.dayend).format();
            })
            $('#allLendingPackages').DataTable({
                data: allLendingPackages,
                "pageLength": 50,
                "bLengthChange": false,
                "bFilter" : false,
                "columns": [
                    {'data': 'amount', 'title' : 'Gói', 'sType': 'number', "bVisible": true, "bSearchable": false},
                    {'data': 'datecreate', 'title' : 'Ngày tạo', 'sType': 'datetime', 'bVisible': true, "bSearchable": true},
                    {'data': 'dayend', 'title' : 'Ngày hoàn vốn', 'sType': 'datetime', 'bVisible': true, "bSearchable": true},
                    
                    ]
                ,
                "order": [[ 1, "desc" ]],
            });
        });

        AjaxLoad($http, "/lending/my-all-commissions", 'GET', {token : curtoken}, function(data){
            var allCommission = data.data;
            $('#listCommission').append("<tfoot><tr><td colspan='2'></td><td></td></tr></tfoot>");
            $('#listCommission').DataTable({
                data: allCommission,
                "pageLength": 50,
                "bLengthChange": false,
                "bFilter" : false,
                "columns": [
                    
                    {'data': 'datecreate', 'title' : 'Ngày nhận', 'sType': 'datetime', 'bVisible': true, "bSearchable": true},
                    {'data': 'type', 'title' : 'Loại hoa hồng', 'sType': 'string', 'bVisible': true, "bSearchable": true},
                    {'data': 'amount', 'title' : 'Số lượng', 'sType': 'number', "bVisible": true, "bSearchable": false},
                    ]
                ,
                "order": [[ 0, "desc" ]],
                "footerCallback": function ( row, data, start, end, display ) {
                    var api = this.api(), data;
                    
                    // Remove the formatting to get integer data for summation
                    var intVal = function ( i ) {
                        return typeof i === 'string' ?
                            i.replace(/[\$,]/g, '')*1 :
                            typeof i === 'number' ?
                                i : 0;
                    };
         
                    // Total over all pages
                    var total = api
                        .column( 2 )
                        .data()
                        .reduce( function (a, b) {
                            return intVal(a) + intVal(b);
                        }, 0 );
         
                    // Update footer
                    $( api.column( 0 ).footer() ).html(
                        'Total : '
                    );
                    $( api.column( 2 ).footer() ).html(
                        total +' USD'
                    );
                }
            });
        });
        
    });

    app.controller("downlineCtrl", function($scope, $http){
        AjaxLoad($http, "/user/downline-info", 'GET', {token : curtoken}, function(data){
            console.log(data.data);
            $scope.downlineInfo = data.data;
        });
        
        var projectTask = [];
        var option = {
            width: "100%",
            dataSource: projectTask, //bound to flat data source,
            autoGenerateColumns: false,
            primaryKey: "code",
            foreignKey: "parentCode",
            initialExpandDepth: -1,
            columns: [
                { headerText: "code", key: "code", width: "25%", dataType: "number" , hidden : true},
                { headerText: "Username", key: "username", width: "35%", dataType: "string" },
                // { headerText: "Sponsor Address", key: "sponsorAddress", width: "35%", dataType: "string" },
                { headerText: "Register day", key: "datecreate", width: "25%", dataType: "string" },
            ],
            features: [
                {
                    name: "Paging",
                    mode: "allLevels",
                    pageSize: 20,
                    currentPageIndex: 0,
                    contextRowMode: "parent"
                }
            ]
        };
        AjaxLoad($http, "/user/getlistdownline", 'GET', {token : curtoken}, function(data){
            //console.log(data);
            option.dataSource = data.data;	
			$("#treegridDownline").igTreeGrid(option);
        });

    });



    
})(myApp);




