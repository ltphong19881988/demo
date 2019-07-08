



var app = angular.module("myApp" , [
    // 'ui.router',
    // 'ui.bootstrap'
]);

app.controller("frontPageCtrl", function(){
    
});
app.directive("mainContent", function(){
    console.log('hi hi');
    return {
        restrict : "E",
        templateUrl : "tpls/home.html",
        link: function(scope, elm, attrs, ctrl) {
            RunFAQ();
        }
    }
    
})

AOS.init();

var RunFAQ = function(){
    $(".accordion-item").addClass('motherfuker');
    if( jQuery(".accordion-title").hasClass('active') ){
        jQuery(this).parent().find('.accordion-inner').show();
    }
    $("a.accordion-title").click(function(e){
        e.preventDefault();
        
        if( jQuery(this).hasClass('active') ){
            jQuery(this).removeClass("active").parent().find('.accordion-inner').slideUp(200);
        }
        else{	jQuery(this).addClass("active").parent().find('.accordion-inner').slideDown(200);
        }
    });
}


angular.element(document).ready(function () {
    console.log('page loading completed');
});

