/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http, $rootScope) {

    $http.post('/api/lists/mylists', {
        username: $rootScope.currentUser.username
    })
    .success(function(res) {
        if (res.error) console.error(res.error);
        else $scope.myLists = res.entries;
    });

    $scope.newList = function(name) {
        $http.post('/api/lists/newlist', {
            username: $rootScope.currentUser.username,
            name: name
        })
        .success(function(res) {
            if (res.error) console.error(res.error);
            else {
                $scope.myLists.push(res.newList);
                $scope.activeList = res.newList;
                $scope.newListName = '';
            }
        });
    };

    $scope.deleteList = function(list) {
        $http.post('/api/lists/deletelist', {
            username: $rootScope.currentUser.username,
            id: list._id
        })
        .success(function(res) {
            if (res.error) console.error(res.error);
            else {
                console.log('list "' + list.name + '" deleted!');
                var index = $scope.myLists.indexOf(list);
                $scope.myLists.splice(index, 1);
            }
        })
    }

    $scope.selectList = function(list) {
        if ($scope.activeList === list) $scope.activeList = null;
        else $scope.activeList = list;
    }

});