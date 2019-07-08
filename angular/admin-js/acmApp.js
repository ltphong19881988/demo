var curtoken = localStorage.getItem('token');
if (curtoken) {
  jQuery.ajaxSetup({
    headers: {
      'x-access-token': curtoken
    }
  });
}

var adminApp = angular.module('adminApp', [
    'ngRoute',
    'ui.router',
    'datatables',
    'datatables.buttons',
    'ui.bootstrap',
    'ui.bootstrap.datetimepicker',
]);

adminApp.config(function($routeProvider, $locationProvider, $stateProvider) {
  
    $routeProvider
    .when("/media", {
        templateUrl : "/tpls/admin/media.html",
        controller : "mediaCtrl"
    })
    .when("/category", {
      templateUrl : "/tpls/admin/category.html",
      controller : "categoryCtrl"
    })
    .when("/post", {
      templateUrl : "/tpls/admin/post.html",
      controller : "postCtrl"
    })
    .when("/product", {
      templateUrl : "/tpls/admin/product/product.html",
      controller : "productCtrl"
    })
    .when("/product/:productId/:action", {
      templateUrl : "/tpls/admin/product/product-details.html",
      controller : "productCtrl",
      params: {
        productId: { squash: true, value: null },
      }
    })
    .when("/service", {
      templateUrl : "/tpls/admin/service/index.html",
      controller : "serviceCtrl"
    })
    .when("/service/:serviceId/:action", {
      templateUrl : "/tpls/admin/service/service-detail.html",
      controller : "serviceCtrl",
      params: {
        productId: { squash: true, value: null },
      }
    })
    .when("/hair-sample", {
      templateUrl : "/tpls/admin/hair-sample/index.html",
      controller : "hairSampleCtrl"
    })
    .when("/hair-sample/:hairId/:action", {
      templateUrl : "/tpls/admin/hair-sample/hair-sample-detail.html",
      controller : "hairSampleCtrl",
      params: {
        productId: { squash: true, value: null },
      }
    })
    .when("/promotion", {
      templateUrl : "/tpls/admin/promotion/index.html",
      controller : "promotionCtrl"
    })
    .when("/order/cart", {
      templateUrl : "/tpls/admin/order/cart-index.html",
      controller : "orderCtrl",
    })
    .when("/video", {
      templateUrl : "/tpls/admin/video/index.html",
      controller : "videoCtrl"
    })
    .when("/notification", {
      templateUrl : "/tpls/admin/notification/index.html",
      controller : "notificationCtrl"
    })

    // $stateProvider
    // .state('admin', {
    //     url: "/",
    //     templateUrl : "/tpls/main/dashboard.html",
    //     controller : "dashboardCtrl"
    //   },
    //   {
    //     url: '/:productId/:method',
    //     templateUrl: "/tpls/admin/product/product-details.html",
    //     controller: 'productCtrl',
    //     params: {
    //       productId: { squash: true, value: null },
    //     }
    //   }
    // )
    
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    }).hashPrefix('*');

    
});

// Run a function for init the app ( before content loaded )
adminApp.run(function($rootScope, $http) {
    
    // getUserInfo($http, function(result){
    //     console.log(result);
    //     $rootScope.userinfo = result;
    //     $rootScope.referralLink = document.location.host + "/register?u=" + $rootScope.userinfo.username;
    // });

    //alert("I'm global foo!");
    $rootScope.$on("$locationChangeStart", function(event, next, current) { 
        // handle route changes     
        menuChanged(next);
    });
    
});


// app.config(['$routeProvider', '$stateProvider' , '$locationProvider', function($routeProvider, $stateProvider, $locationProvider) {
//     //$routeProvider.otherwise('/');

//     $stateProvider
//     .state("/", {
//         url : '/',
//         templateUrl : "/tpls/main/dashboard.html"
//     })
//     .state("abc", {
//         url : '/abc',
//         templateUrl : "/tpls/main/abc.html"
//     })
//     // .when("/green", {
//     //   templateUrl : "green.htm"
//     // })
//     // .when("/blue", {
//     //   templateUrl : "blue.htm"
//     // });
//     $locationProvider.html5Mode({
//         enabled: true,
//         requireBase: false
//       }).hashPrefix('*');
//   }]);