'use strict';

var SearchEngineApp = angular.module('SearchEngineApp', ['ui.directives', 'ui.filters', 'ngTable', 'ui.bootstrap', 'dialogs', 'ngDialog'  ] 
);
SearchEngineApp.config(function($routeProvider ) {
    $routeProvider.when(
    	'/Search', 
    	{
    		templateUrl: 'htm/Search.html', 
    		controller: 'SearchController'
    	});
    $routeProvider.when('/Manage',
    	{
    	    templateUrl: 'htm/Search.html',
    	    controller: 'SearchController'
    	});
    $routeProvider.when('/Search/edit/:id', {
        templateUrl: 'htm/Search.html',
        controller: 'SearchController'
    });
    $routeProvider.otherwise(
        {
            redirectTo: '/Search'
        });
}); 
SearchEngineApp.directive('showOnRowHover',

function () {
    return {
        link: function (scope, element, attrs) {

            element.closest('tr').bind('mouseenter', function () {
                element.show();
            });
            element.closest('tr').bind('mouseleave', function () {
                element.hide();

                var contextmenu = element.find('#contextmenu');
                contextmenu.click();

                element.parent().removeClass('open');

            });

        }
    };
});



SearchEngineApp.directive('myMaxlength', ['$compile', '$log', function ($compile, $log) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            attrs.$set("ngTrim", "false");
            var maxlength = parseInt(attrs.myMaxlength, 10);
            ctrl.$parsers.push(function (value) {
               // $log.info("In parser function value = [" + value + "].");
                if (value.length > maxlength) {
                   // $log.info("The value [" + value + "] is too long!");
                    value = value.substr(0, maxlength);
                    ctrl.$setViewValue(value);
                    ctrl.$render();
                   // $log.info("The value is now truncated as [" + value + "].");
                }
                return value;
            });
        }
    };
}]);
SearchEngineApp.directive('modalDialog', function () {
    return {
        restrict: 'E',
        scope: {
            show: '='
        },
        replace: true, // Replace with the template below
        transclude: true, // we want to insert custom content inside the directive
        link: function (scope, element, attrs) {
            scope.dialogStyle = {};
            if (attrs.width)
                scope.dialogStyle.width = attrs.width;
            if (attrs.height)
                scope.dialogStyle.height = attrs.height;
            scope.hideModal = function () {
                scope.show = false;
            };
        },
        template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
    };
});

SearchEngineApp.directive('srMaxlength', ['$window', srMaxlength]);

function srMaxlength($window) {
    // Usage:
    // use if you need to switch max length validation dynamically based on
    // Creates:
    // removes old validator for max length and creates new one 
    var directive = {
        require: 'ngModel',
        link: link,
        restrict: 'A'
    };

    return directive;

    function link(scope, element, attrs, ctrl) {
        attrs.$observe("srMaxlength", function (newval) {
            var maxlength = parseInt(newval, 10);
            var name = "srMaxLengthValidator";

            for (var i = ctrl.$parsers.length - 1; i >= 0; i--) {
                if (ctrl.$parsers[i].name !== undefined && ctrl.$parsers[i].name == name) {
                    ctrl.$parsers.splice(i, 1);
                }
            }

            for (var j = ctrl.$formatters.length - 1; j >= 0; j--) {
                if (ctrl.$formatters[j].name !== undefined && ctrl.$formatters[j].name == name) {
                    ctrl.$formatters.splice(j, 1);
                }
            }

            ctrl.$parsers.push(maxLengthValidator);
            ctrl.$formatters.push(maxLengthValidator);

            //name the function so we can find it always by the name
            maxLengthValidator.name = name;

            function maxLengthValidator(value) {
                if (!ctrl.$isEmpty(value) && value.length > maxlength) {
                    ctrl.$setValidity('maxlength', false);
                    return undefined;
                } else {
                    ctrl.$setValidity('maxlength', true);
                    return value;
                }
            }
        });
    }
}
