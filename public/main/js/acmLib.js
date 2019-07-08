var getUrlParameter = function (name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function copyToClipboard(elem) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.textContent = elem.textContent;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);

    // copy the selection
    var succeed;
    try {
        succeed = document.execCommand("copy");
    } catch (e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }

    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    return succeed;
}

var menuChanged = function(href){
    if(jQuery("#main-menu").hasClass("show")){
        jQuery("button.navbar-toggler").click();
    }
    
    var listA = jQuery("#main-menu").find("a");
    jQuery("#main-menu").find("li").removeClass("active").removeClass("show");
    jQuery("#main-menu").find("li").find("ul").removeClass("show");
    for(var i = 0; i < listA.length; i++)
    {
        var a = listA.eq(i);
        if(href.indexOf(a.attr("href")) != -1 ){
            var ul = a.parent().parent();
            var li = a.parent();
            // console.log(ul.attr("class"));
            if(ul.hasClass("sub-menu")) {
                // console.log("sub");
                ul.parent().addClass("show").addClass("active");
                ul.addClass("show");
            }
            if(ul.hasClass("navbar-nav")) {
                // console.log("nav");
                li.addClass("active");
            }
            
        }
    }
}

var registerTabChange = function($scope){
    if(getUrlParameter("u")){
        $scope.sponsor = getUrlParameter("u");
        jQuery("#sponsorLabel").show();
    }
    jQuery(".round-tab").click(function(){
        jQuery(".round-tab").parent().parent().removeClass("active").addClass("disabled");
        jQuery(this).parent().parent().addClass("active");
        jQuery(".tab-pane").removeClass("in").removeClass("active");
        jQuery("#" + jQuery(this).parent().attr("aria-controls")).addClass("in").addClass("active");
    });
    jQuery("#stepper-reg-1 .next-step").click(function(){
        jQuery(".tab-pane").removeClass("in").removeClass("active");
        jQuery("#stepper-reg-2").addClass("in").addClass("active");
        jQuery(".round-tab").parent().parent().removeClass("active").addClass("disabled");
        $(".nav.nav-tabs li").eq(1).addClass("active");
    });
    jQuery("#stepper-reg-2 .next-step").click(function(){
        jQuery(".tab-pane").removeClass("in").removeClass("active");
        jQuery("#stepper-reg-3").addClass("in").addClass("active");
        jQuery(".round-tab").parent().parent().removeClass("active").addClass("disabled");
        $(".nav.nav-tabs li").eq(2).addClass("active");
    });
    jQuery("#stepper-reg-2 .prev-step").click(function(){
        jQuery(".tab-pane").removeClass("in").removeClass("active");
        jQuery("#stepper-reg-1").addClass("in").addClass("active");
        jQuery(".round-tab").parent().parent().removeClass("active").addClass("disabled");
        $(".nav.nav-tabs li").eq(0).addClass("active");
    });
    jQuery("#stepper-reg-3 .prev-step").click(function(){
        jQuery(".tab-pane").removeClass("in").removeClass("active");
        jQuery("#stepper-reg-2").addClass("in").addClass("active");
        jQuery(".round-tab").parent().parent().removeClass("active").addClass("disabled");
        $(".nav.nav-tabs li").eq(1).addClass("active");
    });
}

var readFileToBase64 = function(ele, callback) {
    if (ele.files && ele.files[0]) {
      var FR= new FileReader();
      FR.onloadend = function() {
        callback(FR.result);
      }
      FR.readAsDataURL(ele.files[0]);
    }
}

jQuery(document).ready(function ($) {
    // Copy button click event
    $(document).on("click", ".copyButton", function(e){
        var copyTarget = $(this).attr('copyTarget');
        copyToClipboard(document.getElementById(copyTarget));
        $("#link-copied-message").show();
        setTimeout(function() {
                $("#link-copied-message").hide();
        }, 1500);
    });

    // Edit Profiles input blur or enter 
    $(document).on("blur", ".editProfiles", function(e){
        $(this).hide();
        $(this).parent().find("a").find("span").show();
    });
    $(document).on("keyup", ".editProfiles", function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(this).hide();
            $(this).parent().find("a").find("span").show();	
        }
    });

    // $(document).on("click", "#main-menu a", function(e){
    //     var ul = $(this).parent().parent();
    //     if(ul.hasClass("sub-menu")) {
    //         setTimeout(function(){ 
    //             ul.addClass("show"); ul.parent().addClass("show");
    //         }, 50);
    //     }
        
    // });

    

})



var postLogin = function(formData, $http, callback){
    if(jQuery("#requestSending").val() === "on") {
        return;
    }else{
        $http({
            method: 'POST',
            url: '/login',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: formData,
            beforeSend: function() {
                jQuery("#requestSending").val("on");
                jQuery("#formLogin .alert").html("processing ...");
            },
            complete: function() {
                jQuery("#requestSending").val("off");
            }
        }).then(function successCallback(response) {
            callback(response.data);
              // this callback will be called asynchronously
              // when the response is available
        }, function errorCallback(response) {
            jQuery("#requestSending").val("off");
            jQuery("#formLogin .alert").html("Error, please reload the page and try again !").addClass("alert-danger");
              // called asynchronously if an error occurs
              // or server returns response with an error status.
        });
    }
}
var postVerify2FA = function(formData, $http, callback){
    if(jQuery("#requestSending").val() === "on") {
        return;
    }else{
        $http({
            method: 'POST',
            url: '/verify2fa',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: formData,
            beforeSend: function() {
                jQuery("#requestSending").val("on");
                console.log("sending");
            },
            complete: function() {
                jQuery("#requestSending").val("off");
                console.log("done");
            }
        }).then(function successCallback(response) {
            callback(response.data);
        }, function errorCallback(response) {
        });
    }
}
var postRegister = function(formData, $http, callback){
    $http({
        method: 'POST',
        url: '/register',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: formData
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
    });
}

var getcountries = function($http, callback){
    $http({
        method: 'GET',
        url: '/get-countries',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
    });
}

var getUserInfo = function($http, callback){
    $http({
        method: 'GET',
        url: '/user/getuserinfo',
    }).then(function successCallback(response) {
        callback(response.data);
          // this callback will be called asynchronously
          // when the response is available
    }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
    });
}

var get2FAInfo = function($http, callback){
    $http({
        method: 'GET',
        url: '/user/2fa-info',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
    });
}

var updateUserProfiles = function(formData, $http, callback){
    $http({
        method: 'POST',
        url: '/user/profiles',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: formData
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var changePassword = function(formData, $http, callback){
    $http({
        method: 'POST',
        url: '/user/change-password',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: formData
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}
// Wallet Controller
var getWallet = function($http, callback){
    $http({
        method: 'GET',
        url: '/wallet/get-wallet',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var getUSDWalletHistories = function($http, callback){
    $http({
        method: 'GET',
        url: '/wallet/get-usd-histories',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var submitTranser = function(formData, $http, callback){
    if(jQuery("#requestSending").val() === "on") {
        return;
    }else{
        $http({
            method: 'POST',
            url: '/wallet/transfer',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: formData,
            beforeSend: function() {
                jQuery("#requestSending").val("on");
            },
            complete: function() {
                jQuery("#requestSending").val("off");
            }
        }).then(function successCallback(response) {
            callback(response.data);
        }, function errorCallback(response) {
        });
    }
}

// Dashboard Controller
var getCurrencyPrice = function($http, callback){
    $http({
        method: 'GET',
        url: '/wallet/get-currency-price',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var getCommission = function($http, callback){
    $http({
        method: 'GET',
        url: '/wallet/get-commission',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var getInvestmentPackages = function($http, callback){
    $http({
        method: 'GET',
        url: '/investment/get-investment-packages',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var getPackage = function(id, $http, callback){
    $http({
        method: 'GET',
        url: '/investment/get-package?id=' + id,
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var getBalance = function($http, callback){
    $http({
        method: 'GET',
        url: '/investment/get-balance',
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
        callback({status : false});
    });
}

var createPackage = function(formData, $http, callback){
    $http({
        method: 'POST',
        url: '/investment/create-package',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: formData
    }).then(function successCallback(response) {
        callback(response.data);
    }, function errorCallback(response) {
    });
}