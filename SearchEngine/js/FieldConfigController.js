'use strict';
SearchEngineApp.controller('whatsYourNameCtrl', function ($scope ,data, SchemaService) {
    $scope.SchemaInfo = SchemaService.GetSchema();

    $scope.cancel = function () {
        $modalInstance.dismiss('canceled');
    }; // end cancel

    $scope.save = function () {
        $modalInstance.close($scope.user.name);
    }; // end save

    $scope.hitEnter = function (evt) {
        if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.name, null) || angular.equals($scope.name, '')))
            $scope.save();
    }; // end hitEnter
}); // end whatsYourNameCtrl