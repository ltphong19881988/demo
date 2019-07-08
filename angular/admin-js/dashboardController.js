
// ==================== dashboard Controller ================

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

adminApp.controller("abcCtrl", function($rootScope, $scope, $compile, $http, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    $rootScope.pageTitle = "Admin - Dashboard";
    console.log('hura')

    
});