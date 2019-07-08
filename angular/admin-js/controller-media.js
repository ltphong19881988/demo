// ==================== Media Controller ================
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

var liElementHtml = function(name, path){
    // <i class="fa fa-edit" ng-click="editFolder($event)"></i>
    var html = `<li style="position:relative;"  >
                <i class="fa fa-plus" path="` + path + `" ng-click="preAddFolder($event)" data-toggle="modal" data-target="#addFolderModal" ></i>
                <i class="fa fa-close" path="` + path + `" ng-click="deleteFolder($event)"></i>
                <div class="nono" ng-click="setActiveFolder($event)" path="` + path + `">
                    <i class="fa fa-folder-open-o"></i><a>` + name +  ` </a>
                </div>
            </li>`
    return html ;
}

var appendFilesToViewMedia = function(files, elementNode, $compile, $scope){
    angular.element(elementNode).html('');
    files.forEach(element => {
        var abc = element.split('\\');
        var html = `<li  ng-mouseover="hoverPic($event)" ng-mouseleave="leavePic($event)" >
                <img style="max-height:90px;" src="` + ($scope.acviteFolderPath + element).replace(/\\/g, '/').replace('public', '') + `" />
                <p>` + abc[abc.length -1 ] + `</p>
        </li>`;
        angular.element(elementNode).append( $compile(html)($scope) );
    })
}

adminApp.controller("mediaCtrl", function($rootScope, $scope, $compile, $http){
    $rootScope.pageTitle = "Admin - Media Manager";
    var item = jQuery("#treeFolder > ul");
    $scope.rootFolder = 'media';
    $scope.rootFolderPath = 'public/uploads/media/';
    $scope.acviteFolder = 'media';
    $scope.acviteFolderPath = 'public/uploads/media/';
    function GetAllDirChild(eleNode){
        jQuery("#listFiles").html('');
        var valuePath = eleNode.attr('path');
        listAllFilesAndFolder($http, {value :  valuePath, type: "list"}, function(response){
            if(response.dirs.length > 0){
                var parent = eleNode.parent().eq(0);
                if(parent.find('ul').length == 0){
                    angular.element(parent).append( $compile("<ul></ul>")($scope) );
                    response.dirs.forEach(element => {
                        var html = liElementHtml(element, $scope.acviteFolderPath + element + "/") ;
                        angular.element(parent.find('ul').eq(0)).append( $compile(html)($scope) );
                    });
                }
                appendFilesToViewMedia (response.files, jQuery("#listFiles"), $compile, $scope);
            }

        })
    };

    GetAllDirChild(jQuery('#startRoot'));
    $scope.preAddFolder = function(e){
        $scope.acviteFolderPath = jQuery(event.currentTarget).attr('path')
    }

    $scope.addFolder = function( e){
        var name = jQuery("#addFolderModal .modal-body input[name='folderName']").eq(0).val();
        var dataPost = {type : 'add', path: $scope.acviteFolderPath, name : name};
        callEditFolder($http, dataPost, function(response){
            jQuery(".btn-post-data").prop('disabled', false);
            if(response.code){
                if(response.code == "EEXIST"){
                    jQuery("#addFolderModal .modal-body .help-block").html("Folder đã tồn tại");
                }
            }else{
                var parentPath = response.split(name)[0];
                var div = jQuery('.nono');
                for(var i = 0; i < div.length; i ++){
                    if(div.eq(i).attr('path') == parentPath) {
                        var liParent = div.eq(i).parent();
                        var html = liElementHtml(dataPost.name, dataPost.path + dataPost.name + '/')
                        if(liParent.find('ul').length > 0){
                            angular.element(liParent.find('ul').eq(0)).append( $compile(html)($scope) );
                        }else{
                            html = "<ul>" + html + "</ul>" ;
                            angular.element(liParent).append( $compile(html)($scope) );
                        }
                    }
                }
                jQuery("#addFolderModal .modal-body .help-block").html("Add folder thành công");
            }
            console.log(response);
        });
    }

    $scope.setActiveFolder = function( event){
        var target = event.currentTarget;
        $scope.acviteFolderPath = target.getAttribute('path');
        var abc = $scope.acviteFolderPath.split('/') ;
        // console.log('abc', abc);
        $scope.acviteFolder = abc[abc.length - 2];
        GetAllDirChild(jQuery(target));
        // console.log(target);
    };

    $scope.deleteFolder = function( event){
        var target = event.currentTarget;
        var deletePath = jQuery(target).parent().find('div.nono').eq(0).attr('path') ;
        var r = confirm(`Xác nhận xóa tất cả file của thư mục : "` + deletePath + `" ?`);
        if (r == true) {
            let params = {
                method : 'POST', 
                url : '/admin/media/folder',
                data : {
                    type : 'remove',
                    path : deletePath,
                }
            }
            submitBackend(params, $http, function(res) {
                if(res == params.data.path){
                    jQuery(target).parent().remove();
                }
                console.log('delete folder response ', res);
            });

        } else {
            return ;
        }
        
    };

    uploadListener(jQuery("#prepareBtn"), jQuery("#uploadProcess"), $compile, $scope, $http);

    // $scope.selectPic = function(e){
    //     console.log(e.currentTarget);
    //     var item = jQuery(e.currentTarget);
    //     if(item.hasClass('selected')){
    //         item.css( 'border', 'none' ).removeClass('selected');
    //     }else{
    //         item.css( 'border', '1px solid #666' ).addClass('selected');
            
    //     }
        
    // }

    $scope.hoverPic = function(e){
        var item = jQuery(e.currentTarget);
        if( ! item.hasClass('selected')){
            item.css( 'border', '1px solid #666' ).css('border-radius', '5px').addClass('selected');
            var html = `<div class="picActions">
                            <button class="btn btn-danger btn-sm" ng-click="removePic($event)">
                                <i class="fa fa-remove"></i>
                            </button>
                        </div>` ;
            angular.element(item).append( $compile(html)($scope) );
            angular.element(item).find('div.picActions').css({'position' : 'absolute', 'top' : '5px', 'right' : '5px'});
        }
        
    }

    $scope.leavePic = function(e){
        var item = jQuery(e.currentTarget);
        jQuery(e.currentTarget).css( 'border', 'none' ).removeClass('selected');
        angular.element(item).find('div.picActions').remove();
    }

    $scope.removePic = function(e){
        var target = e.currentTarget ;
        var src = 'public' + jQuery(target).parent().parent().find('img').eq(0).attr('src');
        var parent = jQuery(target).parent().parent();
        var r = confirm(`Xác nhận xóa file : "` + src + `" ?`);
        if (r == true) {
            let params = {
                method : 'POST', 
                url : '/admin/media/uploadfile',
                data : {
                    type : 'remove',
                    path : src,
                }
            }
            console.log(jQuery(target).parent().parent().html());
            submitBackend(params, $http, function(res) {
                if(res == params.data.path){
                    console.log('trungf ne tml');
                    parent.remove();
                }
            });

        } else {
            return ;
        }
    }


});