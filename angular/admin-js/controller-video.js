
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

adminApp.controller("videoCtrl", function($rootScope, $scope, $compile, $http, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    $rootScope.pageTitle = "Admin - Video";
    $scope.rootFolder = 'media';
    $scope.rootFolderPath = 'public/uploads/media/';
    $scope.acviteFolder = 'media';
    $scope.acviteFolderPath = 'public/uploads/media/';

    // Add video
    $scope.form = {videoTitle : '', videoUrl : ''};
    $scope.submitAddVideo = function(e){
        let params = {
            method : 'POST', 
            url : '/admin/video/add',
            data : $scope.form,
        }
        submitBackend(params, $http, function(res) {
            console.log(res);
            if(res.status){
                window.location.reload();
            }
        });
        // e.preventDefault();
    }

    // Load data table video
    $scope.dtOptions = DTOptionsBuilder.newOptions()
        .withOption('ajax', {
            url: '/admin/video/all-videos',
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
        DTColumnBuilder.newColumn('videoTitle').withTitle('Tiêu đề'),
        DTColumnBuilder.newColumn('videoUrl').withTitle('Url'),
        DTColumnBuilder.newColumn('datecreate').withTitle('Ngày tạo'),
        DTColumnDefBuilder.newColumnDef(0).withTitle('Xử lý a').renderWith(renderAction),
        // DTColumnBuilder.newColumn('categoryType').withTitle('Loại danh mục'),
    ];
    function renderAction(data, type, full) {
        return ' <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#editVideotModal" ng-click="preEitVideo(\'' + full._id + '\');"> ' + "Edit" + '</button>'
                + ' <button class="btn btn-sm btn-danger" ng-click="deleteVideo(\'' + full._id + '\');"> ' + "Xóa" + '</button>';
    }

    $scope.deleteVideo = function(id){
        var r = confirm("Bạn có chắc là muốn xóa video này ?");
        if (r == true) {
            let params = {
                method : 'DELETE', 
                url : '/admin/video/' + id,
            }
            submitBackend(params, $http, function(res) {
                console.log(res);
                if(res.status){
                    
                }
            });
        } else {
            return;
        }
    }

    $scope.preEitVideo = function(id){
        let params = {
            method : 'GET', 
            url : '/admin/video/' + id,
        }
        submitBackend(params, $http, function(res) {
            if(!res.status){
                alert(res.mes);
            }else{
                $scope.formEdit = res.video;
            }
        });
    }

    $scope.submitEditVideo = function(e){
        let params = {
            method : 'PUT', 
            url : '/admin/video/' + $scope.formEdit._id,
            data : {
                video : {
                    videoTitle : $scope.formEdit.videoTitle,
                    videoUrl : $scope.formEdit.videoUrl
                }
            } ,
        }
        submitBackend(params, $http, function(res) {
            alert(res.mes);
            window.location.reload();
        });
    }

});