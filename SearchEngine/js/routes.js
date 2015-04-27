'use strict';

var SearchEngineApp = angular.module('SearchEngineApp', ['ui.directives', 'ui.filters', 'ngTable', 'ui.bootstrap' ]);
SearchEngineApp.config(function($routeProvider) {
    $routeProvider.when(
    	'/Search', 
    	{
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
})