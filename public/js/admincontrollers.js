
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

    // app.controller("indexCtrl", function($scope, $http, $window){
    //     if(getUrlParameter('username')){
    //         $scope.searchkey = getUrlParameter('username');
    //     }
    //     AjaxLoad($http, "/admin/statistic" + location.search, 'GET', {token : curtoken}, function(data){
    //         console.log(data.data);
    //         $scope.btc = data.data.btc; $scope.eth = data.data.eth; $scope.vnc = data.data.vnc; $scope.usd = data.data.usd;
    //     });       
        
    // });

    app.controller("treeUserCtrl", function($scope, $http){
        $scope.profiletitle = "Your profile : ";
        $scope.title = "User profile page ";

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
                { headerText: "Ngày tạo", key: "datecreate", width: "25%", dataType: "string" },
                { headerText: "Đếm tuyến dưới", key: "countMember", width: "25%", dataType: "number" },
                { headerText: "Số gói lending", key: "countLending", width: "25%", dataType: "number" },
                { headerText: "Tổng lending", key: "usdLending", width: "25%", dataType: "string" },
                {
                    headerText: "View more", key: "viewMore", width: "25%", dataType: "html" 
                },
                { headerText: "Xử lý", key: "action", width: "25%", dataType: "string" },
            ],
            features: [
                {
                    name: "Paging",
                    mode: "allLevels",
                    pageSize: 50,
                    currentPageIndex: 0,
                    contextRowMode: "parent"
                }
            ]
        };
        var abc = '';
        if(getUrlParameter('username')){
            abc = "?username=" + getUrlParameter('username');
        }
        AjaxLoad($http, "/admin/member/get-tree-user" + abc, 'GET', {token : curtoken}, function(data){
            //console.log(data);
            data.data.forEach(element => {
                element.viewMore = `<button><a href="/admin?username=` + element.username + `" >xem</a></button>`;
                if(element.lock == false){
                    element.action = `<button class='action' data-value="/admin/member/lock?username=` + element.username + `&value=true" >Lock</a></button>`;
                }else{
                    element.action = `<button class='action' data-value="/admin/member/lock?username=` + element.username + `&value=false" >Active</a></button>`;
                }
                
            });
            option.dataSource = data.data;	
			$("#treegridDownline").igTreeGrid(option);
        });
        
    });

    app.controller("allUserCtrl", function($scope, $http, $window){
        $scope.profiletitle = "Your profile : ";
        $scope.title = "User profile page ";
        // console.log(location);
        if(getUrlParameter('username')){
            $scope.searchkey = getUrlParameter('username');
        }
        AjaxLoad($http, "/admin/member/get-all-user" + location.search, 'GET', {token : curtoken}, function(data){
            // console.log(data.data);
            data.data.forEach(element => {
                element.btcAmount = element.btcAmount.toFixed(2);
                element.ethAmount = element.ethAmount.toFixed(2);
                element.vncAmount = element.vncAmount.toFixed(2);
            });
            $scope.listUser = data.data;

        });

        AjaxLoad($http, "/admin/member/count-all-user" + location.search, 'GET', {token : curtoken}, function(data){
            $scope.totalItems = parseInt(data.data);
            var perPage = 10;
            var totalPages = parseInt($scope.totalItems / perPage) + 1;
            $scope.prevBtn = `<a class="paginate_button previous"  data-dt-idx="0" tabindex="0"
            id="DataTables_previous">Previous</a>`;
            if(getUrlParameter('page') == 1){
                $scope.prevBtn = `<a class="paginate_button previous disabled"  data-dt-idx="0" tabindex="0"
                            id="DataTables_previous">Previous</a>`;
            }
            $scope.pageBtn = `<span> `;
            for(var i = 1 ; i <= totalPages; i ++){
                $scope.pageBtn += ` <a class="paginate_button "  data-dt-idx="` + i + `" tabindex="0">` + i + `</a> `;
            }
            $scope.pageBtn += `</span>`;
            // $scope.nextBtc = '';
            $('#listUser').parent().append($scope.prevBtn);
            $('#listUser').parent().append($scope.pageBtn);
        });

        

        $scope.searchUser = function(abc){
            var page = getUrlParameter('page');
            var hihi = '';
            if(page != '' && page != null && page != 'undefined'){
                hihi = location.host + location.pathname + '?username=' + abc + '&page=' + page ;
            }else{
                hihi = location.host + location.pathname + '?username=' + abc;
            }
            location.href = "http://" + hihi;
        }
        
    });

    app.controller("transactionsCtrl", function($scope, $http, $window){
        if(getUrlParameter('username')){
            $scope.searchkey = getUrlParameter('username');
        }
        var header = [
            {field : 'userdetail.username', name : "Username", type : "String", isFilter : true},
            {field : 'walletType', name : "Wallet", type : "String", isFilter : true},
            {field : 'type', name : "", type : "String", isFilter : true},
            {field : 'amount', name : "", type : "String", isFilter : true},
            {field : 'datecreate', name : "Ngày tạo", type : "Date", isFilter : true, visible : true, format : 'DD/MM/YYYY HH:mm:ss'},
            {field : 'address', name : "", type : "String", isFilter : true},
            {field : 'txid', name : "", type : "String", isFilter : true},
            {field : 'source', name : "", type : "String", isFilter : true},
            //{field : 'Details', name : "Chi tiết", type : "Button", isFilter : false, class : 'memberDetails'},
            // {field : 'phoneb', name : "phone number", type : "Button", isFilter : false},
        ];
        
        var table = new darkTable("transactionsTable", header );
        table.setRowPerPage(20);
        
        table.getData('/admin/transactions/all-transactions-index', {cur_page : 1}, function(result){            
            // console.log('search key', table.searchkey);
        })     

        $(document).on('click', '#transactions_to_excel', function(e){
            var popup = $('[data-popup="popup-main"]');
            $.ajax({
                url: '/admin/transactions/transactions-to-excel',
                data: darkTableCache.searchKey,
                type: "POST",
                xhrFields: {
                    responseType: 'blob'
                },
                beforeSend: function(){
                    popup.find('.popup-contain').html('Loading ....');
                    popup.fadeIn(350);
                },
                success: function (result) {
                    var blob = new Blob([result], { type: 'application/xlsx' });
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'lich su giao dich.xlsx';
                    link.click();
                    popup.fadeOut(350);
                }, 
                error : function(err){
                    var popup = $('[data-popup="popup-main"]').find('.popup-contain').html(err);
                }
            });
        })

        // function đây nè
        // tạo biến Flag
        
        
    });

    //COmmissions Ctrl
    app.controller("commissionsCtrl", function($scope, $http, $window){
        if(getUrlParameter('username')){
            $scope.searchkey = getUrlParameter('username');
        }
        var header = [
            {field : 'userdetail.username', name : "Username", type : "String", isFilter : true},
            {field : 'coinTransfer', name : "Loại tiền", type : "String", isFilter : true},
            {field : 'type', name : "", type : "String", isFilter : true},
            {field : 'amount', name : "", type : "String", isFilter : true},
            {field : 'datecreate', name : "Ngày tạo", type : "Date", isFilter : true, visible : true, format : 'DD/MM/YYYY HH:mm:ss'},
            // {field : 'address', name : "", type : "String", isFilter : true},
            {field : 'txid', name : "", type : "String", isFilter : true},
            {field : 'source', name : "", type : "String", isFilter : true},
            //{field : 'Details', name : "Chi tiết", type : "Button", isFilter : false, class : 'memberDetails'},
            // {field : 'phoneb', name : "phone number", type : "Button", isFilter : false},
        ];
        
        var table = new darkTable("commissionsTable", header );
        table.setRowPerPage(20);
        
        table.getData('/admin/commissions/all-commissions-index', {cur_page : 1}, function(result){            
            // console.log('search key', table.searchkey);
        })     

        $(document).on('click', '#commissions_to_excel', function(e){
            var popup = $('[data-popup="popup-main"]');
            $.ajax({
                url: '/admin/commissions/commissions-to-excel',
                data: darkTableCache.searchKey,
                type: "POST",
                xhrFields: {
                    responseType: 'blob'
                },
                beforeSend: function(){
                    popup.find('.popup-contain').html('Loading ....');
                    popup.fadeIn(350);
                },
                success: function (result) {
                    var blob = new Blob([result], { type: 'application/xlsx' });
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'lich su giao dich.xlsx';
                    link.click();
                    popup.fadeOut(350);
                }, 
                error : function(err){
                    var popup = $('[data-popup="popup-main"]').find('.popup-contain').html(err);
                }
            });
        })

        // function đây nè
        // tạo biến Flag
    });


})(myApp);



$(document).on('click', '.paginate_button ', function(e){
    var page = $(this).attr('data-dt-idx');
    window.location.href = location.origin + location.pathname + "?page=" + page;
})

$(document).on('click', '.action ', function(e){
    var page = $(this).attr('data-value');
    var txt;
    var r = confirm('Bạn có chắc muốn thay đổi ?');
    if (r == true) {
        $.get(page, function(result){
            console.log(result);
            alert("Đã xong");
            window.location.reload();
        })
    } else {
        return false;
    }
})





