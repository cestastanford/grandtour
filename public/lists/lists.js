/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http) {

    $scope.response = 'loading...';
    $http.get('/api/lists', {
        request: 'nothing'
      }
    )
    .success(function(res){
        console.log(res);
    });

});