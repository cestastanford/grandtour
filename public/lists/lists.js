/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http, $rootScope) {

    //  model initialization
    var listModel = {
        myLists: null,
        selectedList: null,
        newListName: '',
        listsLoading: false,
    };
    $scope.listModel = listModel;

    //  download lists
    listModel.listsLoading = true;
    $http.post('/api/lists/mylists', {
        username: $rootScope.currentUser.username
    })
    .success(function(res) {
        if (res.error) console.error(res.error);
        else listModel.myLists = res.entries;
        listModel.listsLoading = false;
    });

    $scope.newList = function(name) {
        $http.post('/api/lists/newlist', {
            username: $rootScope.currentUser.username,
            name: name
        })
        .success(function(res) {
            if (res.error) console.error(res.error);
            else {
                listModel.myLists.push(res.newList);
                $scope.selectList(res.newList);
                listModel.newListName = '';
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
                var index = listModel.myLists.indexOf(list);
                listModel.myLists.splice(index, 1);
                listModel.selectedList = null;
            }
        });
    };

    $scope.selectList = function(list) {
        if (listModel.selectedList === list) listModel.selectedList = null;
        else {
            listModel.selectedList = list;
            if (!list.entriesLoaded) downloadEntries(list);
        }
    };

    function downloadEntries(list) {
        list.entries = [];
        if (!list.entryIDs.length) list.entriesLoaded = true;
        else for (var i = 0; i < list.entryIDs.length; i++) {
            var id = list.entryIDs[i];
            $http.get('/api/entries/' + id)
            .success((function(res) {
                if (res.error) console.error(error);
                else {
                    var i = this;
                    list.entries[i] = res.entry;
                    if (list.entries.length === list.entryIDs.length) list.entriesLoaded = true;
                }
            }).bind(i));
        }
    };

});