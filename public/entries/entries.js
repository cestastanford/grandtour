/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntriesCtrl', function($scope, $http) {

  $scope.search = function(){
    $scope.lastSearch = $scope.fullName;
    $scope.searching = true;
    $http.post('/api/entries/search', { fullName:$scope.fullName})
    .success(function(res){
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
    });
  }



});
