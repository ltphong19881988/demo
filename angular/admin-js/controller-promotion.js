// ==================== Promotion Controller ================

adminApp.controller("promotionCtrl", function($rootScope, $scope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    $rootScope.pageTitle = "Admin - Mã khuyến mãi";
    
    let abc = {
        method : 'GET',
        url: '/admin/promotion/all-promotion',
        data : {}
    }
    $scope.dtOptions = DTOptionsBuilder.newOptions()
        .withOption('ajax', {
            url: '/admin/promotion/all-promotion',
            type: 'POST'
        })
        .withOption('serverSide', true)
        .withOption('processing', true)
        .withOption('bInfo', false)
        .withOption('searching', false)
        .withOption('createdRow', function ( row, data, index ) {
            $compile(row)($scope);  //add this to compile the DOM
        })
        // .withOption('order', [[1, 'asc'], [1, 'asc']])
        // .withPaginationType('full_numbers');
    $scope.dtColumns = [
        DTColumnBuilder.newColumn('_id').withTitle('ID').notVisible(),
        DTColumnBuilder.newColumn('code').withTitle('Mã'),
        DTColumnBuilder.newColumn('username').withTitle('User'),
        DTColumnBuilder.newColumn('status').withTitle('Tình trạng').renderWith(function(data, type, full) {
            if(full.status == false){
                return '<p class="text-green">Chưa dùng</p>';
            }else if(full.status == true) {
                return '<p class="text-red">Đã dùng</p>';
            }
        }),
        DTColumnBuilder.newColumn('price').withTitle('Giá trị'),
        DTColumnBuilder.newColumn('type').withTitle('Loại mã').renderWith(function(data, type, full) {
            if(full.type == 0){
                return ' VND';
            }else if(full.type == 1) {
                return ' %';
            }
        }),
        // DTColumnBuilder.newColumn('datecreate').withTitle('Ngày tạo'),
        DTColumnDefBuilder.newColumnDef(0).withTitle('Xử lý').renderWith(renderAction),
    ];

    function renderAction(data, type, full) {
        return ' <button class="btn btn-danger" ng-click="deletePromotion(\'' + full._id + '\');"> ' + "Xóa" + '</button>';
    }

    $scope.submitAddPromotion = function(e){
        var params = {
            method : 'POST',
            url: '/admin/promotion/add-promotion',
            data : {
                type: jQuery("#formAddPromotion select[name='type']").eq(0).val(),
                price : jQuery("#formAddPromotion input[name='price']").eq(0).val(),
                quantity : jQuery("#formAddPromotion input[name='quantity']").eq(0).val(),
            }
        }
        jQuery("#formAddPromotion button[type='submit']").prop('disabled', true);
        submitPromotion(params, $http, function(result){
            alert(result.mes);
            jQuery("#formAddPromotion button[type='submit']").prop('disabled', false);
        })
        e.preventDefault()
    }

    $scope.deletePromotion =  function (id){
        var r = confirm("Bạn có chắc muốn xóa");
        if (r == true) {
            let params = {
                method : 'DELETE', 
                url : '/admin/promotion/item/' + id,
            }
            submitBackend(params, $http, function(res) {
                console.log('delete promotion response', res);
                alert(res.mes);
                if(res.status) window.location.reload();
            });
        } else {
            return;
        }
        
    }

});