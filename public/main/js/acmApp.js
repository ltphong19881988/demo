var curtoken = localStorage.getItem('token');
if (curtoken) {
  jQuery.ajaxSetup({
    headers: {
      'x-access-token': curtoken
    }
  });
}

var authPage = angular.module('authPage', [
    'ngRoute',
    'ui.router'
]);
authPage.factory("interceptors", [httpInterceptors]);
authPage.config(function($routeProvider, $locationProvider, $httpProvider) {
    $httpProvider.interceptors.push('interceptors');
    $routeProvider
    .when("/login", {
        templateUrl : "/tpls/authPage/login.html",
        controller : "loginCtrl"
    })
    .when("/register", {
        templateUrl : "/tpls/authPage/register.html",
        controller : "registerCtrl"
    })
    .when("/verify-authentication", {
        templateUrl : "/tpls/authPage/verify2fa.html",
        controller : "verify2faCtrl"
    })
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    }).hashPrefix('*');
});


/// ==============
var app = angular.module('acmApp', [
    'ngRoute',
    'ui.router'
]);
app.factory("interceptors", [httpInterceptors]);
app.config(function($routeProvider, $locationProvider, $httpProvider) {
    $httpProvider.interceptors.push('interceptors');
    $routeProvider
    .when("/dashboard", {
        templateUrl : "/tpls/main/dashboard.html",
        controller : "dashboardCtrl"
    })
    .when("/dashboard/abc", {
        templateUrl : "/tpls/main/abc.html"
    })
    .when("/investment/index", {
        templateUrl : "/tpls/investment/investment.html",
        controller : "investmentCtrl"
    })
    .when("/investment/create-package", {
        templateUrl : "/tpls/investment/create-package.html",
        controller : "createPackageCtrl"
    })
    .when("/user/profiles", {
        templateUrl : "/tpls/user/profiles.html",
        controller : "profilesCtrl"
    })
    .when("/user/members", {
        templateUrl : "/tpls/user/members.html",
        controller : "membersCtrl"
    })
    .when("/user/authentication", {
        templateUrl : "/tpls/user/authentication.html",
        controller : "authenticationCtrl"
    })
    .when("/wallet/index", {
        templateUrl : "/tpls/wallet/index.html",
        controller : "walletCtrl"
    })
    .when("/wallet/withdraw", {
        templateUrl : "/tpls/wallet/withdraw.html",
        controller : "withdrawCtrl"
    })
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    }).hashPrefix('*');

    
});

// Run a function for init the app ( before content loaded )
app.run(function($rootScope, $http) {
    
    // getUserInfo($http, function(result){
    //     console.log(result);
    //     $rootScope.userinfo = result;
    //     $rootScope.referralLink = document.location.host + "/register?u=" + $rootScope.userinfo.username;
    // });

    //alert("I'm global foo!");
    $rootScope.$on("$locationChangeStart", function(event, next, current) { 
        // handle route changes     
        console.log()
        menuChanged(next);
    });
    
});


function httpInterceptors() {
    return {
        // if beforeSend is defined call it
        'request': function(request) {
            if (request.beforeSend)
                request.beforeSend();
            return request;
        },
        // if complete is defined call it
        'response': function(response) {
            if (response.config.complete)
                response.config.complete(response);
            return response;
        }
    };
}
  