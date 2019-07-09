adminApp.controller("hairSampleCtrl", function($rootScope, $scope, $http, $compile, $routeParams, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder){
    console.log($routeParams);
    $scope.rootFolderPath = 'public/uploads/media/';
    $scope.acviteFolderPath = 'public/uploads/media/';
    $scope.checkSelect = 0;
    $scope.listGallerySelect = [];
    $scope.listImgsPost = [];
    if($routeParams.action == "add") $rootScope.pageTitle = "Admin - Thêm mới mẫu tóc đẹp";
    if($routeParams.action == "edit") {
        $rootScope.pageTitle = "Admin - Sửa dịch vụ";
        jQuery("section.card .card-title").html("Sửa mẫu tóc đẹp");
        let params = {
            method : 'GET', 
            url : '/admin/product/item/' + $routeParams.serviceId,
        }
        submitBackend(params, $http, function(res) {
            console.log('get service item', res);
            $scope.productItem = res;
            if(res.postContent){
                CKEDITOR.instances['editorDescription'].setData(res.postContent.descriptions);
                CKEDITOR.instances['editorContent'].setData(res.postContent.content);
            }
            jQuery('#productCategory option').text(res.category.name);
            jQuery('#productCategory option').val(res.category._id);
        });
    }

    if($routeParams.action != null){
        if(parseInt(jQuery('#formAddProduct div.node').eq(0).attr('status')) == 0)
        {
            let params = {
                method : 'GET', 
                url : '/admin/category/all-category?idParent=5d1ef3b1e3039d1146fac322',
            }
            submitBackend(params, $http, function(res) {
                console.log('all service cate', res);
                abcXYZ(res, jQuery("#formAddProduct .card-body").eq(0), "basic", $scope, $compile);
            });
        } 
        uploadListener(jQuery("#prepareBtn"), jQuery("#uploadProcess"), $compile, $scope, $http);
        // remove pic from products img
        selectedImgRemoveListener("#productImgs .divImg .fa-close");

        $scope.addImgsToPost = function(){
            jQuery("#uploadModal button.close").click();
            appendSelectedImg (jQuery("#productImgs"), jQuery("#uploadProcess ul li img"), 'name');
        }

        // Click to Open modal get pics from gallery
        jQuery(document).on("click", "#formAddProduct button[data-target='#galleryModal']", function(){
            selectChangeListener ($scope, $http, $compile);
        })

        // Event click slect or diselect images from modal gallery list
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

        jQuery(document).on("click", "#galleryModal .btn-primary", function(){

        })

        jQuery("select[name='folderName']").change(function(){
            var abc = jQuery(this).val();
            if(abc != '') abc += "/";
            $scope.acviteFolderPath = $scope.rootFolderPath + abc ;
            selectChangeListener ($scope, $http, $compile);
        })

        // $scope.showHideCategory = function(){
        //     // jQuery("div.node")[0] is type HTML Element, jQuery("div.node").eq(0) is not T__T
        //     if( ! isVisible(jQuery("#formAddProduct div.node")[0])) jQuery("#formAddProduct div.node").show();
        //     else jQuery("#formAddProduct div.node").hide();
        // }

        jQuery(document).on("click", "li.node div.block", function(){
            jQuery('#productCategory option').text(jQuery(this).text());
            jQuery('#productCategory option').val(jQuery(this).parent().attr('parent'));
            jQuery("#formAddProduct div.node").hide();
        })

    }else{
        $scope.dtOptionsHair = DTOptionsBuilder.newOptions()
        .withOption('ajax', {
            url: '/admin/product/all-post',
            type: 'POST',
            data : {
                idCategoryType : '5d1ef2f2570523135404e821'
            }
        })
        // .withDataProp('data')
        .withOption('serverSide', true)
        .withOption('processing', true)
        .withOption('bInfo', false)
        // .withOption('searching', false)
        .withOption('order', [[0, 'asc'], [1, 'asc']])
        .withOption('createdRow', function ( row, data, index ) {
            $compile(row)($scope);  //add this to compile the DOM
        })
        // .withPaginationType('full_numbers');
        $scope.dtColumnsHair = [
            DTColumnBuilder.newColumn('_id').withTitle('ID').notVisible(),
            DTColumnBuilder.newColumn('title').withTitle('Tiêu đề'),
            DTColumnBuilder.newColumn('categoryName').withTitle('Danh mục'),
            DTColumnBuilder.newColumn('datecreate').withTitle('Ngày tạo'),
            DTColumnDefBuilder.newColumnDef(0).withTitle('Xử lý').renderWith(render),
            // DTColumnBuilder.newColumn('categoryType').withTitle('Loại danh mục'),
        ];
        function render(data, type, full) {
            return ' <button class="btn btn-primary btn-sm" ng-click="goToEdit(\'' + full._id + '\');"> ' + "EDIT" + '</button>';
          }
    }

    $scope.goToEdit = function(id){
        // console.log(id);
        window.location = '/admin/hair-sample/' + id + '/edit' ;
    }

    $scope.submitProduct = function(e){
        var params = {action: $routeParams.action, data : {_id : $routeParams.serviceId} };
        if(params.action == "add") params.method = "POST";
        if(params.action == "edit") {
            params.method = "PUT";
            params.data.nameKey = $scope.productItem.nameKey;
            params.data.contentId = $scope.productItem.postContent._id;
        }
        params.data = formDatatoObj(params.data, jQuery("#formAddProduct"));
        submitProduct(params, $http, function(result){
            alert(result.mes);
            console.log(result);
            // if(result.status) window.location.reload();
        })
        e.preventDefault()
    }



    

});