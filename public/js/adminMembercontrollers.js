


(function(app){
    "use strict";

    app.controller("indexCtrl", function($scope, $http, $window){
        if(getUrlParameter('username')){
            $scope.searchkey = getUrlParameter('username');
        }
        AjaxLoad($http, "/admin/statistic" + location.search, 'GET', {token : curtoken}, function(data){
            console.log(data.data);
            $scope.btc = data.data.btc; $scope.eth = data.data.eth; $scope.vnc = data.data.vnc; $scope.usd = data.data.usd;
        });       
        
    });

    app.controller("memberIndexCtrl", function($scope, $http, $window){
        if(getUrlParameter('username')){
            $scope.searchkey = getUrlParameter('username');
        }
        var header = [
            {field : 'username', name : "Username", type : "String", isFilter : true},
            {field : 'email', name : "", type : "String", isFilter : true},
            {field : 'phone', name : "", type : "String", isFilter : true},
            {field : 'datecreate', name : "Ngày tạo", type : "Date", isFilter : true, visible : true, format : 'DD/MM/YYYY'},
            {field : 'count', name : "Số gói lending", type : "number", isFilter : false},
            {field : 'sum', name : "Tổng tiền", type : "number", isFilter : false},
            {field : 'Details', name : "Chi tiết", type : "Button", isFilter : false, class : 'memberDetails'},
            // {field : 'phoneb', name : "phone number", type : "Button", isFilter : false},
        ];
        
        var indexMembers = new darkTable("indexMembers", header );
        indexMembers.setRowPerPage(20);
        indexMembers.getData('/admin/member/all-member-index', {cur_page : 1}, function(result){            
            
        })     
        
        $('#indexMembers').on('click', '.memberDetails', function(){
            $.ajax({
                url: '/admin/member/view-details/' + $(this).attr('key'),
                // data: dataPost,
                type: "GET",
                beforeSend: function(){
                    var popup = $('[data-popup="popup-main"]');
                    popup.find('.popup-contain').html('Loading ....');
                    popup.fadeIn(350);
                },
                success: function (result) {
                    var popup = $('[data-popup="popup-main"]').find('.popup-contain').html(result);
                }, 
                error : function(err){
                    console.log('loi', err);
                }
            });
        })

        $(document).on('submit', '#editMember', function(e){
            $("#editMember .reg-error").html("");
            var data = $(this).serialize();
            $.ajax({
                url: "/admin/member/edit-member",
                data: data,
                type: "POST",
                success: function (result) {
                    for (var i = 0; i < result.mes.length ; i++) {
                        $("#editMember .reg-error").append("<span>" + result.mes[i] + "</span>");
                    }
                    if (result.status == true) {
                        $("#editMember .reg-error").addClass ('reg-success');
                        $("#editMember").find('input[name="resetPassword"]').prop("checked", false);
                    }
                }, 
                error : function(err){
                    $("#editMember .reg-error").html(err.responseText);
                    console.log(err.responseText);
                }
            });
            e.preventDefault();
        })

        // function đây nè
        // tạo biến Flag
        
        $('#indexMembers').on('change paste keyup', '.filter_key', function(){
            
           // Test đi ba, a đù @@ =))
           // Não phẳng mẹ rồi 

            // $.ajax({
            //     url: '/admin/member/view-details/' + $(this).attr('key'),
            //     // data: dataPost,
            //     type: "GET",
            //     beforeSend: function(){
            //         var popup = $('[data-popup="popup-main"]');
            //         popup.find('.popup-contain').html('Loading ....');
            //         popup.fadeIn(350);
            //     },
            //     success: function (result) {
            //         var popup = $('[data-popup="popup-main"]').find('.popup-contain').html(result);
            //     }, 
            //     error : function(err){
            //         console.log('loi', err);
            //     }
            // });
        })
        
    });

   

})(myApp);






