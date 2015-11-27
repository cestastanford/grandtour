/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http, $rootScope) {

    $http.post('/api/lists/mylists', {
        username: $rootScope.currentUser.username
    })
    .success(function(res) {
        $scope.mylists = res.entries;
    });

    $scope.newList = function(name) {
        $http.post('/api/lists/newlist', {
            username: $rootScope.currentUser.username,
            name: name
        })
        .success(function(res) {
            if (res.error) {
                console.log(res.error);
            } else {
                $scope.mylists.push(res.newList);
            }
        });
    };

});