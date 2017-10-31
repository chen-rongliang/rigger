'use strict';

var app = angular.module('app', []).config(function($sceProvider) {
  // Completely disable SCE.  For demonstration purposes only!
  // Do not use in new projects or libraries.
  $sceProvider.enabled(false);
});

app.controller('dataList', function($scope, $http, $sce, $filter) {
  $http.get('/rigger-list')
    .then(function(result) {
      $scope.list = result.data || [];
    });
  
  $scope.getLabelCls = function(index) {
    return 'label-' + (index % 2 == 0 ? 'info' : 'warning');
  }
});
