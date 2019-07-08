
// ==================== Video Controller ================

var submitBackend = function( params, $http, callback){
    $http({
        method: params.method,
        url: params.url,
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        data: params.data
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

adminApp.controller("notificationCtrl", function($rootScope, $scope, $compile, $http, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    $rootScope.pageTitle = "Admin - Thông báo";

    $scope.pickerAdd = {
        date: new Date(),
        datepickerOptions: {
            startingDay: 0,
            showWeeks : false,
        }
    };
    $scope.openCalendar = function(e, name) {
        $scope[name].open = true;
    };
    // Add video
    $scope.form = {title : '', body : ''};
    $scope.submitAddNotification = function(e){
        $scope.form['startTime'] = $scope.pickerAdd.date ;
        let params = {
            method : 'POST', 
            url : '/admin/notification/add',
            data : $scope.form,
        }
        submitBackend(params, $http, function(res) {
            console.log(res);
            alert(res.mes);
            if(res.status){
                window.location.reload();
            }
        });
        // e.preventDefault();
    }

    // Load data table video
    $scope.dtOptionsNotification = DTOptionsBuilder.newOptions()
        .withOption('ajax', {
            url: '/admin/notification/all-notifications',
            type: 'POST'
        })
        .withOption('serverSide', true)
        .withOption('processing', true)
        .withOption('bInfo', false)
        .withOption('searching', false)
        .withOption('createdRow', function ( row, data, index ) {
            $compile(row)($scope);  //add this to compile the DOM
        })
        .withOption('initComplete', function(){
            jQuery('.tongleNotification').each(function(index, value){
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
    $scope.dtColumnsNotification = [
        DTColumnBuilder.newColumn('_id').withTitle('ID').notVisible(),
        DTColumnBuilder.newColumn('title').withTitle('Tiêu đề'),
        DTColumnBuilder.newColumn('body').withTitle('Nội dung'),
        // DTColumnBuilder.newColumn('datecreate').withTitle('Ngày tạo').renderWith(function(data, type, full){
        //     return moment(new Date(full.datecreate)).format('YYYY-MM-DD HH:mm:ss');
        // }),
        DTColumnBuilder.newColumn('startTime').withTitle('Ngày gửi').renderWith(function(data, type, full){
            return moment(new Date(full.startTime)).format('YYYY-MM-DD HH:mm:ss');
        }),
        DTColumnBuilder.newColumn('sendStatus').withTitle('Đã gửi').renderWith(function(data, type, full){
            var check = '';
            if(full.sendStatus) check = 'checked' ;
            return `<input class="tongleNotification" disabled type="checkbox" data-size="small" ` + check +
                    `  data-onstyle="success" data-on="Yes" data-off="No">` ;
        }),
        DTColumnDefBuilder.newColumnDef(0).withTitle('Xử lý').renderWith(renderAction),
    ];
    function renderAction(data, type, full) {
        console.log(full);
        return ' <button class="btn btn-primary" data-toggle="modal" data-target="#editNotificationtModal" ng-click="preEitNotification(\'' + full._id + '\');"> ' + "Edit" + '</button>'
                + ' <button class="btn btn-danger" ng-click="deleteNotification(\'' + full._id + '\');"> ' + "Xóa" + '</button>';
    }

    $scope.deleteNotification = function(id){
        var r = confirm("Bạn có chắc là muốn xóa thông báo này ?");
        if (r == true) {
            let params = {
                method : 'DELETE', 
                url : '/admin/notification/' + id,
            }
            submitBackend(params, $http, function(res) {
                console.log(res);
                alert(res.mes);
                if(res.status){
                    window.location.reload();
                }
            });
        } else {
            return;
        }
    }

    $scope.preEitNotification = function(id){
        let params = {
            method : 'GET', 
            url : '/admin/notification/' + id,
        }
        submitBackend(params, $http, function(res) {
            if(!res.status){
                alert(res.mes);
            }else{
                console.log(res)
                $scope.formEdit = res.noti;
                $scope.pickerEdit = {
                    date: new Date(res.noti.startTime),
                    datepickerOptions: {
                        startingDay: 0,
                        showWeeks : false,
                    }
                };
            }
        });
    }

    $scope.submitEditNotification = function(e){
        let params = {
            method : 'PUT', 
            url : '/admin/notification/' + $scope.formEdit._id,
            data : {
                noti : {
                    title : $scope.formEdit.title,
                    body : $scope.formEdit.body,
                    startTime : $scope.pickerEdit.date, 
                }
            } ,
        }
        submitBackend(params, $http, function(res) {
            alert(res.mes);
            window.location.reload();
        });
    }

});