
authPage.controller("registerCtrl", function($scope, $rootScope, $http){
    $rootScope.pageTitle = "Acommax - register";
    registerTabChange($scope);
    getcountries($http, function(countries){
        $scope.countries = countries;
    })
    
    $scope.submitRegister = function(e){
        // $("#formLogin .reg-error").html("");
        var formData = $("#formRegister").serialize();
        //console.log(formData);
        postRegister(formData, $http, function(registerRes){
            if (registerRes.status == true) {
                console.log(registerRes)
                setTimeout(function () {
                    window.location.href = "/login";
                }, 1500);
            }else{
                console.log(registerRes);
            }
        });
        e.preventDefault();
    };
});

authPage.controller("loginCtrl", function($scope, $rootScope, $http){
    $rootScope.pageTitle = "Acommax - Login";
    $scope.submitLogin = function(e){
        jQuery(".alert").html("").removeClass("alert-success").removeClass("alert-danger");
        var formData = $("#formLogin").serialize();
        //console.log(formData);
        postLogin(formData, $http, function(loginResponse){
            if (loginResponse.status == true) {
                localStorage.setItem('token', loginResponse.token);
                $("#formLogin .alert").addClass("alert-success").html(loginResponse.mes);
                $("#formLogin")[0].reset();
                var abc = getUrlParameter("redirect");
                if (typeof abc === "undefined" || abc == null) {
                    abc = "/dashboard";
                }
                setTimeout(function () {
                    window.location.href = abc;
                }, 1500);
            }else{
                jQuery("#formLogin .alert").addClass("alert-danger").html(loginResponse.mes);
            }
            //console.log(loginResponse);
        });
        e.preventDefault();
    };
});

authPage.controller("verify2faCtrl", function($scope, $rootScope, $http){
    $rootScope.pageTitle = "Acommax - Verify 2FA";
    $scope.submit2FA = function(e){
        $(".alert").html("").removeClass("alert-success").removeClass("alert-danger");
        var formData = $("#form2FA").serialize();
        //console.log(formData);
        postVerify2FA(formData, $http, function(loginResponse){
            if (loginResponse.status == true) {
                localStorage.setItem('token', loginResponse.token);
                $(".alert").addClass("alert-success").html(loginResponse.mes);
                var abc = getUrlParameter("redirect");
                if (typeof abc === "undefined" || abc == null) {
                    abc = "/dashboard";
                }
                setTimeout(function () {
                    window.location.href = abc;
                }, 1500);
            }else{
                $(".alert").addClass("alert-danger").html(loginResponse.mes);
            }
        });
        e.preventDefault();
    };
});


// =========================

app.controller("dashboardCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Dashboard";
    getUserInfo($http, function(result){
        $scope.userinfo = result;
        $scope.referralLink = location.host + "/register?u=" + $scope.userinfo.username;
    });
    getCurrencyPrice($http, function(result){
        $scope.btcPrice = result.btcPrice.data.rates.USD ;
        $scope.ethPrice = result.ethPrice.data.rates.USD ;
    })
});

app.controller("profilesCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - User Profiles";
    jQuery("#avatarBase64").change(function(){
        readFileToBase64(jQuery(this)[0], function(result){
            jQuery("#changeAvatar img").attr("src", result);
            jQuery("input[name='avatar']").val(result);
        } );
    });
    jQuery("#changeAvatar").hover(function(){
        jQuery("#changeAvatar button").show();
    });
    jQuery("#changeAvatar").mouseleave(function(){
        jQuery("#changeAvatar button").hide();
    });
    jQuery("#changeAvatar button").click(function(){
        jQuery("#avatarBase64").click();
    });
    getUserInfo($http, function(result){
        // console.log(result);
        if(!result.fullname) result.fullname = "() Add here";
        $scope.userinfo = result;
    });

    $scope.editProfiles = function(e){
        var a = jQuery(e.currentTarget);
        a.find("span").hide();
        var input = a.parent().find("input").eq(0);
        input.show().focus();
    }

    $scope.changePassword = function(form, event){
        var formData = form.$$element.serialize();
        changePassword(formData, $http, function(result){
            console.log(result);
        });
        event.preventDefault();
    }

    $scope.formUpdateProfiles = function(e){
        var formData = jQuery("#formUpdateProfiles").serialize();
        updateUserProfiles(formData, $http, function(result){
            console.log(result);
        })
        e.preventDefault();
    }
});

app.controller("membersCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Members";
    // getUserInfo($http, function(result){
    //     // console.log(result);
    //     if(!result.fullname) result.fullname = "() Add here";
    //     $scope.userinfo = result;
    // });

    jQuery('#tree').jstree({
        'core' : {
            'data' : {
                'url' : function (node) {
                return node.id === '#' ?
                    '/user/tree-root' :
                    '/user/tree-children' 
                },
                'data' : function (node) {
                    return { 'id' : node.id };
                }
            },
            'check_callback' : function (operation, node, node_parent, node_position, more) {
                // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                // in case of 'rename_node' node_position is filled with the new node name
                console.log(operation);
                return operation === 'rename_node' ? true : false;
            }
        }
    });
    
    $scope.editProfiles = function(e){
        var a = jQuery(e.currentTarget);
        a.find("span").hide();
        var input = a.parent().find("input").eq(0);
        input.show().focus();
    }

});

app.controller("authenticationCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Two-Factor Authentication";
    get2FAInfo($http, function(result){
        $scope.authInfo = result;
        if(result.enable2fa === true){
            jQuery(".card-body").eq(0).html("<h4>You have been enabled 2FA</h4>");
            jQuery("#form2FA .btn").removeClass("btn-success").addClass("btn-danger").html("Disable 2FA");
        }
    });

    $scope.submitAuth = function(e){
        jQuery(".alert").html("").removeClass('alert-success').removeClass('alert-danger');
        $http({
            method: 'POST',
            url: '/user/verify-auth',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: "authToken="+jQuery("#authToken").val()
        }).then(function successCallback(response) {
            jQuery(".alert").html(response.data.mes);
            if(response.data.status){
                jQuery(".alert").addClass("alert-success");
                setTimeout(function(){ location.reload(); }, 1500);
            }else{
                jQuery(".alert").addClass("alert-danger");
            }
        }, function errorCallback(response) {
        });
        e.preventDefault();
    }
});

app.controller("walletCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Wallet";
    getWallet($http, function(result){
        $scope.listCurrencies = result.listCurrencies;
        $scope.usdBalance = result.usdBalance;
        if(result.enable2fa === true) jQuery(".2fa").show();
    });
    getUSDWalletHistories($http, function(result){
        $scope.histories = result;
    });
    $scope.deposit = function(pair, event){
        jQuery("#depositQrCode").html("");
        $scope.selectedpair = pair;
        for(var i = 0; i < $scope.listCurrencies.length; i++){
            if($scope.listCurrencies[i].pair == pair) $scope.selectedpairAddress = $scope.listCurrencies[i].address ;
        }
        
        var options = {
            // render method: 'canvas', 'image' or 'div'
            render: 'image',
        
            // offset in pixel if drawn onto existing canvas
            left: 0,
            top: 0,
        
            // size in pixel
            size: 200,
        
            // code color or image element
            fill: '#000',
        
            // background color or image element, null for transparent background
            background: null,
        
            // content
            text: $scope.selectedpairAddress,
        
            // corner radius relative to module width: 0.0 .. 0.5
            radius: 0,
            mode: 0,
        
            mSize: 0.1,
            mPosX: 0.5,
            mPosY: 0.5,
        
            label: 'no label',
            fontname: 'sans',
            fontcolor: '#000',
        
        }
        if($scope.selectedpairAddress == "generate failed"){
            $scope.selectedpairAddress += " .Please reload the page or try again later. If you can't fix it, contact support for helping."
        }else{
            jQuery("#depositQrCode").qrcode(options);
        }
    }
    $scope.submitTranser = function(event){
        var formData = jQuery("#formTransfer").serialize();
        jQuery(".alert").html("").removeClass("alert-success").removeClass("alert-danger");
        submitTranser(formData, $http, function(response){
            if (response.status == true) {
                jQuery("#formTransfer .alert").addClass("alert-success").html(response.mes);
                jQuery("#formTransfer")[0].reset();
            }else{
                jQuery("#formTransfer .alert").addClass("alert-danger").html(response.mes);
            }
        });
        event.preventDefault()
    }

});

app.controller("withdrawCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Withdraw";
    getCommission($http, function(result){
        $scope.interestBalance = result.interestBalance;
        $scope.bonusBalance = result.bonusBalance;
    });

    jQuery(".nav-item.nav-link").click(function(){
        var target = jQuery(this).attr("aria-controls");
        jQuery(".tab-pane").removeClass("show").removeClass("active");
        jQuery("#" + target).addClass("show").addClass("active");

        jQuery("select[name='currencyType']").prop('selectedIndex', 0);
        jQuery(".form-control.FA").val( '' );
        jQuery("input[name='address']").attr('placeholder', '');
    })

    jQuery("select[name='currencyType']").change(function(){
        var type = jQuery(this).val();
        if(type == null || type == ''){
            jQuery(".form-control.FA").val( '' );
            jQuery("input[name='address']").attr('placeholder', '');
        }else{
            jQuery(".form-control.FA").val( type );
            if(type == 'btc'){
                jQuery("input[name='address']").attr('placeholder', 'Ex : 3Q8Md9zf4JcFuhMV8Uu5w8Y1VLbidRKMVE');
            }
            if(type == 'eth'){
                jQuery("input[name='address']").attr('placeholder', 'Ex : 0xe42cc70F85806DB20ac0eD19D71518142A7D5f1B');
            }
        }
    })

    $scope.submitWithdraw = function(type, event){
        console.log(type, jQuery("select[name='currencyType']").eq(0).val() ) ;
        event.preventDefault();
    }

});

app.controller("investmentCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Investment";
    getInvestmentPackages($http, function(result){
        $scope.packages = result;
    });
    $scope.submitInvestment = function(package, e){
        var amount = parseInt(jQuery("#" + package._id).val());
        if(isNaN(amount) || amount < package.min || amount > package.max){
            alert("amount must be from " + package.min + " to " + package.max);
            return false;
        }else{
            location.href = "/investment/create-package?id=" + package._id + "&amount=" + amount;
        }
        e.preventDefault();
    }
});

app.controller("createPackageCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Create Package";
    $scope.amount = parseInt(getUrlParameter("amount"));
    $scope.id = getUrlParameter("id");
    getPackage($scope.id, $http, function(result){
        $scope.package = result;
    });
    getBalance($http, function(result){
        $scope.usdBalance = result;
        if(result <= $scope.amount){
            jQuery("form.form-horizontal").hide();
            jQuery("#payPackageError").show();
        }else{
            
        }
        console.log("balance", result);
    });
    $scope.createPackage = function(e){
        var formData = jQuery("#formCreatePackage").serialize();
        createPackage(formData, $http, function(result){
            console.log(result);
        })
        e.preventDefault();
    }
    
});