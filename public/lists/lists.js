/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http, listService) {

    //  initialize view model
    var viewModel = {
        newListName: '',
        selectedList: null,
        selectedListEntries: null
    };

    //  expose view model to scope
    $scope.viewModel = viewModel;

    //  expose shared list model to scope
    $scope.sharedListModel = listService.sharedListModel

    //  functions for list modification
    $scope.newList = function() {
        listService.newList(viewModel.newListName, function(list) {
            viewModel.newListName = '';
            viewModel.selectedList = list;
            console.log('list created: ' + list.name);
        });
    };

    $scope.deleteList = function() {
        listService.deleteList(viewModel.selectedList, function() {
            console.log('list deleted: ' + viewModel.selectedList.name);
            viewModel.selectedList = null;
        });
    };

    $scope.selectList = function(list) {
        if (viewModel.selectedList === list) viewModel.selectedList = null;
        else {
            viewModel.selectedList = list;
            viewModel.selectedListEntries = null;
            downloadEntries(list);
        }
    };

    function downloadEntries(list) {
        var entries = [];
        var entriesDownloaded = 0;
        if (!list.entryIDs.length) viewModel.selectedListEntries = entries;
        else for (var i = 0; i < list.entryIDs.length; i++) {
            var id = list.entryIDs[i];
            $http.get('/api/entries/' + id)
            .then((function(res) {
                if (res.data.error) console.error(error);
                else {
                    var i = this;
                    entries[i] = res.data.entry;
                    if (++entriesDownloaded === list.entryIDs.length) {
                        viewModel.selectedListEntries = entries;
                    }
                }
            }).bind(i), function(res) { console.error(res); });
        }
    };

    $scope.selectAllEntries = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            viewModel.selectedListEntries[i].selected = true;
        }
    };

    $scope.deselectAllEntries = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            viewModel.selectedListEntries[i].selected = false;
        }
    };

    $scope.removeSelectedEntriesFromList = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            var entry = viewModel.selectedListEntries[i];
            if (entry.selected) {
                listService.removeFromList(viewModel.selectedList, entry, (function() {
                    var entry = this;
                    var index = viewModel.selectedListEntries.indexOf(entry);
                    viewModel.selectedListEntries.splice(index, 1);
                }).bind(entry));
            }
        }
    };

});