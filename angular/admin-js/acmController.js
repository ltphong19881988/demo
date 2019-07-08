

var preUploadFiles = function(_files, contentDiv){
    var promise = Promise.resolve();
    _files.map( file => promise.then(()=> {
        convertFiletoBase64(file).then(abc => {
            contentDiv.find("ul").append(`<li>
                <img name="` + abc.name + `" src="` + abc.data + `" />
                <button class="btn btn-danger">Xóa bỏ</button>
            </li>`);

        });
    }));
    contentDiv.show();
}

var uploadListener = function(prepareDiv, contentDiv, $compile, $scope, $http){
    var contentDivID = contentDiv.attr('id');
    prepareDiv.find('.btnUpload').click(function(){
        prepareDiv.find("#uploadBtn").click();
    })
    prepareDiv.find('#uploadBtn').change(function () {
        preUploadFiles(Array.prototype.slice.call(this.files).splice(0, this.files.length), contentDiv);
    })
    jQuery(document).on('click', "#" + contentDivID + " li .btn-danger", function(e){
        jQuery(e.currentTarget).parent().remove();
        if(jQuery("#" + contentDivID + " li").length == 0){
            contentDiv.hide();
        }
    })

    $scope.doUpload = function(e){
        jQuery(e.currentTarget).prop('disabled', true).remove();
        $scope.countUpload = 0;
        var imgs = jQuery("#" + contentDivID + " form img");
        $scope.checkCountUpload = imgs.length;
        for(var i = 0; i < imgs.length; i++){
            var li = imgs.eq(i).parent();
            var data = {type : 'upload', img : {data : imgs.eq(i).attr('src'), name: imgs.eq(i).attr('name')} , path: $scope.rootFolderPath};
            uploadFiles($scope, $http, data, li, function(response){
                // console.log(response);
            })
        }
        setTimeout(() => {
            productListener($compile, $scope, contentDiv);
        }, 1000);
    }
    jQuery(document).on("click", "#" + contentDivID + " button.btn-success",  function(e){
        
        // jQuery(this).prop('disabled', true).remove();
        // $scope.countUpload = 0;
        // var imgs = jQuery("#" + contentDivID + " form img");
        // $scope.checkCountUpload = imgs.length;
        // for(var i = 0; i < imgs.length; i++){
        //     var li = imgs.eq(i).parent();
        //     var data = {type : 'upload', img : {data : imgs.eq(i).attr('src'), name: imgs.eq(i).attr('name')} , path: $scope.rootFolderPath};
        //     uploadFiles($scope, $http, data, li, function(response){
        //         // console.log(response);
        //     })
        // }
        // setTimeout(() => {
        //     productListener($scope, contentDiv);
        // }, 1000);
    })
}

var productListener = function($compile, $scope, contentDiv){
    console.log(window.location.pathname.indexOf("/admin/media"));
    var contentDivID = contentDiv.attr('id');
    if($scope.countUpload == $scope.checkCountUpload){
        if(window.location.pathname.indexOf("/admin/media") > -1)
            jQuery("#" + contentDivID + " .form-group").append(`<button style="float:right;" class="btn btn-danger">Đóng</button>`);
        if(window.location.pathname.indexOf("/admin/product") > -1){
            let html = `<button ng-click="addImgsToPost()" style="float:right;" class="btn btn-primary">Chèn ảnh vào bài</button>` ;
            jQuery("#" + contentDivID + " .form-group").append($compile(html)($scope));
        }
            
    }
    else{
        setTimeout(() => {
            productListener($compile, $scope, contentDiv);
        }, 1000);
    }
}

var appendFilesToView = function(files, elementNode, $compile, $scope){
    angular.element(elementNode).html('');
    files.forEach(element => {
        var abc = element.split('\\');
        var html = `<li ng-click="" >
                <img style="max-height:90px;" src="` + ($scope.acviteFolderPath + element).replace(/\\/g, '/').replace('public', '') + `" />
                <p>` + abc[abc.length -1 ] + `</p>
        </li>`;
        angular.element(elementNode).append( $compile(html)($scope) );
        $scope.addImgToPost = function(e){
            jQuery("#galleryModal button.close").click();
            appendSelectedImg (jQuery("#productImgs"), jQuery("#galleryModal ul#listFiles li.selected img"), 'src');
        }
    })
}


// ==================== Category Controller ================
var addListCategory = function(type, eleNode, response, $scope, $compile){
    var parentId = eleNode.attr('parent');
    if(parentId == "") parentId = null;
    var html = `
        <div>
            <ul style="list-style: none;">
            </ul>
        </div>
        `;
    angular.element(eleNode).append( $compile(html)($scope) )
    for(var k = 0; k < response.length; k++){
        if(response[k].idParent == parentId){
            html = `
                <li class="node" parent="`+ response[k]._id +`" status='0'>
                    <div class="block">
                        <div class="col-md-6">`+ response[k].name +`</div> `;
            if(type == 'full'){
                html += `<div class="col-md-6">`+ response[k].categoryType.name +`
                            <button class="btn btn-danger btn-sm" idParent="`+ response[k]._id +`" nameParent="`+ response[k].name +`"
                            idtype="`+ response[k].categoryType._id +`" priority="`+ response[k].priority + `" ng-click="prepareDelete($event)"  style="float:right;">
                                <i title='Xóa danh mục này' class="fa fa-close"></i>
                            </button>
                            <button class="btn btn-primary btn-sm" idParent="`+ response[k]._id +`" nameParent="`+ response[k].name +`"
                            idtype="`+ response[k].categoryType._id +`" priority="`+ response[k].priority + `" ng-click="prepareEdit($event)"
                            data-toggle="modal" data-target="#editCategoryModal" style="float:right;">
                                <i title='Sửa bài viết của danh mục' class="fa fa-edit"></i>
                            </button>
                            <button class="btn btn-success btn-sm" idParent="`+ response[k]._id +`" nameParent="`+ response[k].name +`"
                            idtype="`+ response[k].categoryType._id +`" priority="`+ response[k].priority + `" ng-click="prepareAdd($event)"
                            data-toggle="modal" data-target="#addCategoryModal" style="float:right;">
                                <i title='Thêm danh mục con' class="fa fa-plus"></i>
                            </button>
                        </div>`
            }
            html += `</div>
                </li>`;
            angular.element(eleNode.find('div > ul')).append( $compile(html)($scope) )
        }
    }
    eleNode.attr('status', '1');
}

var abcXYZ = function (response, parentElement, type, $scope, $compile){
    if(parentElement.find(".node[status='0']").length > 0){
        var node = parentElement.find(".node[status='0']");
        for(var i = 0; i < node.length; i++){
            if(node.eq(i).attr('status') == '0'){
                addListCategory(type, node.eq(i), response, $scope, $compile);
            }
        }
        setTimeout(() => {
            abcXYZ(response, parentElement, type, $scope, $compile);
        }, 200);
    }
}

adminApp.controller("categoryCtrl", function($rootScope, $scope, $compile, $http){
    $rootScope.pageTitle = "Admin - Category";
    $scope.rootFolderPath = 'public/uploads/media/';
    $scope.acviteFolderPath = 'public/uploads/media/';
    $scope.checkSelect = 0;
    $scope.listGallerySelect = [];
    $scope.listImgsPost = [];
    var params = {action: 'PUT', data : {_id : '', idCategoryType : ''} };

    $rootScope.addCategoryForm = {
        parent : {name : '', _id : ''},
        name : '',
        priority : 1,
        categoryType : ''
    };
    $http({
        method: 'GET',
        url: '/admin/category/all-category-type',
    }).then(function successCallback(response) {
        // console.log(response.data);
        $rootScope.categoryType = response.data;
    }, function errorCallback(response) {
    });

    // ========  all category
    getAllCategory($http, function(response){
        $rootScope.listCate = response;
        jQuery("#categoryContent .card-body").eq(0).prepend(`
            <button class='btn btn-success' data-toggle="modal" data-target="#addCategoryModal" >Thêm mới</button>
        `);
        abcXYZ(response, jQuery("#categoryContent .card-body").eq(0), "full", $scope, $compile);
    })

    $scope.prepareAdd = function(e){
        console.log(e.currentTarget);
        jQuery("#formAddCategory input[name='nameParent']").val(jQuery(e.currentTarget).attr('nameParent'));
        jQuery("#formAddCategory input[name='idParent']").val(jQuery(e.currentTarget).attr('idParent'));
        jQuery("#formAddCategory input[name='priority']").val(jQuery(e.currentTarget).attr('priority'));
        var options = jQuery("#formAddCategory select[name='idCategoryType'] option");
        for (var i = 0; i < options.length; i++){
            console.log(options.eq(i).attr('value'), jQuery(e.currentTarget).attr('idtype'));
            if(options.eq(i).attr('value') == jQuery(e.currentTarget).attr('idtype')){
                options.eq(i).attr('selected','selected');
            }
        }
        jQuery("#formAddCategory select[name='idCategoryType'] option:not(:selected)").prop('disabled', true);
    }

    $scope.submitAddCategory = function(e){
        var formData = (jQuery("#formAddCategory").serialize());
        console.log(formData);
        submitAddCategory(formData, $http, function(result){
            console.log(result);
            alert(result.mes);
            window.location.reload();
        })
        e.preventDefault()
    }

    $scope.prepareEdit = function(e){
        jQuery("#formEditCategory #productImgs .divImg").remove();
        CKEDITOR.instances['editorContent'].setData('');
        getCategoryInfo({_id : jQuery(e.currentTarget).attr('idparent')}, $http, function(response){
            params.data._id = response.cate._id;
            params.data.idCategoryType = response.cate.idCategoryType;
            console.log(response);
            jQuery("#formEditCategory input[name='title']").val(response.cate.name);
            if(response.postContent != null)
                CKEDITOR.instances['editorContent'].setData(response.postContent.content);
            if(response.post != null)
            {
                for( var i = 0; i < response.post.pictures.length; i++ ){
                    jQuery("#productImgs").append(`
                        <div class='divImg'>
                            <img src="`+ response.post.pictures[i] + `" />
                            <i class="fa fa-close" ></i>
                        </div>
                    `);
                }
            }
        })
    }

    $scope.submitEditCategory = function(e){
        params.data = formDatatoObj(params.data, jQuery("#formEditCategory"));
        submitEditCategory(params, $http, function(response){
            console.log(response);
            alert(response.mes);
            window.location.reload();
        })
    }

    $scope.prepareDelete = function(e){
        var r = confirm("Bạn có chắc muốn xóa");
        if (r == true) {
            submitDeleteCategory({_id : jQuery(e.currentTarget).attr('idparent')}, $http, function(response){
                console.log(response);
                alert(response.mes);
                window.location.reload();
            })
        } else {
            return;
        }
    }

    jQuery(document).on("click", "#formEditCategory button[data-target='#galleryModal']", function(){
        selectChangeListener ($scope, $http, $compile);
    })

    // Event click slect or diselect images from gallery list
    jQuery(document).on("click", "#galleryModal #listFiles li", function(e){
        var abc = jQuery(this).find('img').eq(0).attr('src');
        if($scope.listGallerySelect.indexOf(abc) == -1) {
            $scope.listGallerySelect.push(abc);
            jQuery(e.currentTarget).addClass('selected');
        } else {
            $scope.listGallerySelect.splice($scope.listGallerySelect.indexOf(abc), 1);
            jQuery(this).removeClass('selected');
        };
        // console.log($scope.listGallerySelect);
    })

    // Event submit selected images from gallery and add images to main add product content
    // jQuery(document).on("click", "#galleryModal .btn-primary", function(){
    //     jQuery("#galleryModal button.close").click();
    //     appendSelectedImg (jQuery("#productImgs"), jQuery("#galleryModal ul#listFiles li.selected img"), 'src');
    // })

    jQuery("select[name='folderName']").change(function(){
        var abc = jQuery(this).val();
        if(abc != '') abc += "/";
        $scope.acviteFolderPath = $scope.rootFolderPath + abc ;
        selectChangeListener ($scope, $http, $compile);
    })
    selectedImgRemoveListener("#productImgs .divImg .fa-close");

});

// ==================== Product Controller ================

var PaginationProduct = function (eleNode, data){
    eleNode.DataTable({
        data: data,
        // "columns": [
        //     {'data': '_id', 'sType': 'string', "bVisible": true, "bSearchable": false},
        //     // {'data': 'title', 'sType': 'number', "bVisible": true, "bSearchable": false},
        //     {'data': 'title', 'title': 'Tiêu đề', 'sType': 'string', 'bVisible': true, "bSearchable": true},
        //     {'data': 'categoryName', 'title': 'Tên danh mục', 'sType': 'string', 'bVisible': true, "bSearchable": true},
        //     {'data': 'categoryType', 'sType': 'string', 'bVisible': true, "bSearchable": true},

        //     ]
        // ,
        // // "order": [[ 2, "desc" ]],
        // "initComplete": function( settings, json ) {
        //     // eleNode.find(' tr th:first-child').hide();
        //     // eleNode.find(' tr td:first-child').hide();
        // }
    });

}

var selectChangeListener = function ($scope, $http, $compile){
    listAllFilesAndFolder($http, {value :  $scope.acviteFolderPath, type: "list-deep"}, function(response){
        if(response.dirs.length > 0 && $scope.rootFolderPath == $scope.acviteFolderPath && $scope.checkSelect == 0){
            var dirs = response.dirs.sort();
            dirs.forEach(element => {
                jQuery("select[name='folderName']").eq(0).append(
                    `<option value="`+ element + `"> media / `+ element.replace('/', ' / ') +`</option>`
                )
            });
            $scope.checkSelect = 1;
        }
        appendFilesToView (response.files, jQuery("#listFiles"), $compile, $scope);
        // console.log($scope.acviteFolderPath, response.files);

    })
}

var appendSelectedImg = function(divAppend, listImgs, field){
    for( var i = 0; i < listImgs.length; i++ ){
        divAppend.append(`
            <div class='divImg'>
                <img src="`+ listImgs.eq(i).attr(field) + `" />
                <i class="fa fa-close" ></i>
            </div>
        `);
    }
}

var selectedImgRemoveListener = function(eleNodesName){
    jQuery(document).on("click", eleNodesName, function(){
        jQuery(this).parent().fadeOut().remove();
    })
}

var formDatatoObj = function(data, formEle){
    for(var i = 0; i < formEle.find("input").length; i++){
        data[formEle.find("input").eq(i).attr('name')] = formEle.find("input").eq(i).val();
    }
    for(var i = 0; i < formEle.find("select").length; i++){
        data[formEle.find("select").eq(i).attr('name')] = formEle.find("select").eq(i).val();
    }
    for(var i = 0; i < formEle.find("textarea").length; i++){
        data[formEle.find("textarea").eq(i).attr('name')] = CKEDITOR.instances[formEle.find("textarea").eq(i).attr('id')].getData();
    }
    data.imgs = [];
    for(var i = 0; i < formEle.find("#productImgs img").length; i++){
        data.imgs.push(formEle.find("#productImgs img").eq(i).attr('src')) ;
    }
    return data;
}



adminApp.controller("transferCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Admin - Transfer";
    $scope.submitTransfer = function(e){
        var formData = (jQuery("#formTransfer").serialize());
        submitTransfer(formData, $http, function(result){
            console.log(result);
        })
        e.preventDefault()
    }
});

adminApp.controller("profilesCtrl", function($rootScope, $scope, $http){
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

adminApp.controller("membersCtrl", function($rootScope, $scope, $http){
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

adminApp.controller("authenticationCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Two-Factor Authentication";
    get2FAInfo($http, function(result){
        $scope.authInfo = result;
    });

    $scope.submitAuth = function(e){
        $http({
            method: 'POST',
            url: '/user/verify-auth',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: "authToken="+jQuery("#authToken").val()
        }).then(function successCallback(response) {
            console.log(response.data);
        }, function errorCallback(response) {
        });
        e.preventDefault();
    }
});

adminApp.controller("walletCtrl", function($rootScope, $scope, $http){
    $rootScope.pageTitle = "Acommax - Wallet";
    getWallet($http, function(result){
        $scope.listCurrencies = result;
        console.log(result);
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

});

adminApp.controller("investmentCtrl", function($rootScope, $scope, $http){
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

adminApp.controller("createPackageCtrl", function($rootScope, $scope, $http){
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