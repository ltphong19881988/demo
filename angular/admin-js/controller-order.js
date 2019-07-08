

// ==================== Order Controller ================

adminApp.controller("orderCtrl", function($rootScope, $scope, $compile, $http, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    $rootScope.pageTitle = "Admin - Đơn đặt hàng";
    var vm = this;
    orderCartDataTable();

    
    $scope.submitEditOrderCart = function(e){
        let params = {
            method : 'PUT', 
            url : '/admin/order/cart/' + item,
            data : {
                orderCart : $scope.orderCartEdit
            }
        }
        submitBackend(params, $http, function(res) {
            console.log('edit order cart response', res);
            if(res.status){
            }
            alert(res.mes);
            // if(res.status){
            //     window.location.reload();
            // }
        });
        e.preventDefault();
    }

    $scope.preEitOrderCart = function (item){
        let params = {
            method : 'GET', 
            url : '/admin/order/cart/' + item,
        }
        submitBackend(params, $http, function(res) {
            // console.log(res);
            if(res.status){
                $scope.orderCartEdit = res.orderCart;
            }
            // alert(res.mes);
            // if(res.status){
            //     window.location.reload();
            // }
        });
    }

    $scope.deleteOrderCart = function(id){
        var r = confirm("Bạn có chắc là muốn xóa đơn hàng này ?");
        if (r == true) {

        } else {
            return;
        }
    }

    var postChangeToggleButton = function (id, full){
        let params = {
            method : 'PUT', 
            url : '/admin/order/cart/' + id,
            data : { setField : full }
        }

        submitBackend(params, $http, function(res) {
            console.log('edit order cart response', res, $scope);
            if(!res.status){
                $scope.dtOptionsCart.reload();
            }
            alert(res.mes);
            // if(res.status){
            //     window.location.reload();
            // }
        });
    }

    


    function orderCartDataTable (){
        $scope.dtOptionsCart = DTOptionsBuilder.newOptions()
        .withOption('ajax', {
            url: '/admin/order/all-order-cart',
            type: 'POST'
        })
        .withOption('serverSide', true)
        .withOption('processing', true)
        .withOption('bInfo', false)
        .withOption('searching', false)
        .withOption('createdRow', function ( row, data, index ) {
            $compile(row)($scope);  //add this to compile the DOM
            // $compile(angular.element(row).contents())($scope);
        })
        .withOption('initComplete', function(){
            jQuery('.tongleOrderCart').each(function(index, value){
                // console.log(index, jQuery(this).attr('value'));
                var dis = jQuery(this).attr('dis');
                jQuery(this).bootstrapToggle({
                    on: 'Yes',
                    off: 'No',
                    size : 'small',
                });
                jQuery(this).bootstrapToggle(jQuery(this).attr('value'));
                if(dis == 1) jQuery(this).bootstrapToggle('disable');
            })
            $scope.phongle = function(id, field){
                // console.log('id', id, 'this', this);
                var abc = {}; abc[field] = this.full[field];
                postChangeToggleButton(id, abc);
            }
        })
        // .withOption('order', [[1, 'asc'], [1, 'asc']])
        // .withPaginationType('full_numbers');

        $scope.dtColumnsCart = [
            DTColumnBuilder.newColumn('_id').withTitle('ID').notVisible(),
            DTColumnBuilder.newColumn('listProduct').withTitle('Sản phẩm').renderWith(renderProducts),
            DTColumnBuilder.newColumn('paymentInfo').withTitle('Thông tin ').renderWith(renderPaymentInfo),
            DTColumnBuilder.newColumn('totalPrice').withTitle('Tổng tiền'),
            DTColumnDefBuilder.newColumnDef(0).withTitle('Thanh toán').renderWith(renderPaymentStatus),
            DTColumnDefBuilder.newColumnDef(0).withTitle('Giao hàng').renderWith(renderSendingStatus),
            DTColumnBuilder.newColumn('type').withTitle('Hủy đơn').renderWith(function(data, type, full) {
                var val = 'off'; disabled= 'dis="0"';
                if(full.type != 0){
                    val = 'on' ;
                    if(full.type == 1) disabled = 'dis="1"';
                } 
                var html =  `<input class="tongleOrderCart" type="checkbox" data-offstyle="primary" data-onstyle="danger" ` + disabled + 
                        ` ng-change="phongle('` + full._id + `' , 'type' ` + `)" ng-model="full.type" value="` + val + `"  >` ;
                return html;
            }),
            
            DTColumnDefBuilder.newColumnDef(1).withTitle('Xử lý').renderWith(renderAction),
        ];

        function renderPaymentStatus (data, type, full){
            var val = 'off'; check = '';
            if(full.paymentStatus){
                val = 'on' ; check = 'checked';
            } 
            var html =  `<input class="tongleOrderCart" data-onstyle="success" type="checkbox" ` +
                    ` ng-change="phongle('` + full._id + `' , 'paymentStatus' ` + `)" ng-model="full.paymentStatus" value="` + val + `"  >` ;
            return html;
        }

        function renderSendingStatus (data, type, full){
            var val = 'off'; check = '';
            if(full.sendingStatus){
                val = 'on' ; check = 'checked';
            }
            var html =  `<input class="tongleOrderCart" data-onstyle="success" type="checkbox" ` +
                    ` ng-change="phongle('` + full._id + `' , 'sendingStatus' ` + `)" ng-model="full.sendingStatus" value="` + val + `"  >` ;
            return html;                    
        }
        function renderProducts (data, type, full){
            var abc =  '';
            full.listProduct.forEach(element => {
                abc += `<div>
                            <p> ` + element.post.postContent.title + `</p>
                            <p> Giá : ` + element.price + ` - Số lượng : ` + element.quantity + `</p>
                        </div>`
            });
            return abc ;
        }
        function renderPaymentInfo(data, type, full){
            if(full.paymentInfo){
                return `<p>Người nhận : <b>`+ full.paymentInfo.receiver + `</b></p>` + `<p>Điện thoại : <b>`+ full.paymentInfo.phone + `</b></p>`
                        + `<p>Địa chỉ : <b>`+ full.paymentInfo.address + `</b></p>` ;
            }else{
                return 'Không có';
            }
            
        }
        function renderAction(data, type, full) {
            return ' <button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#editOrderCartModal" ng-click="preEitOrderCart(\'' + full._id + '\');"> ' + "Edit" + '</button>'
                    + ' <button class="btn btn-danger btn-sm" ng-click="deleteOrderCart(\'' + full._id + '\');"> ' + "Xóa" + '</button>';
        }

    }


    

});

