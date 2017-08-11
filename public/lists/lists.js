/*
*   List management service
*/

app.factory('savedListService', function($rootScope, $http) {

  //  public service object
  var sharedListModel = {
    myLists: null,
    listsLoading: true
  };

  //  create a list
  var newList = function(name, callback) {
    $http.post('/api/lists/newlist', {
      username: $rootScope.currentUser.username,
      name: name
    })
    .then(function(res) {
      if (res.data.error) console.error(res.data.error);
      else {
        sharedListModel.myLists.push(res.data.newList);
        callback(res.data.newList);
      }
    }, function(res) { console.error(res); });
  };

  //  delete a list
  var deleteList = function(list, callback) {
    $http.post('/api/lists/deletelist', {
      username: $rootScope.currentUser.username,
      id: list._id
    })
    .then(function(res) {
      if (res.data.error) console.error(res.data.error);
      else {
        var index = sharedListModel.myLists.indexOf(list);
        sharedListModel.myLists.splice(index, 1);
        callback();
      }
    }, function(res) { console.error(res); });
  };

  //  add to a list
  var addToList = function(list, entry, callback) {
    if (list.entryIDs.indexOf(entry.index) > -1) callback({ alreadyInList: true });
    else {
      $http.post('/api/lists/addtolist', {
        listID: list._id,
        entryIndex: entry.index
      })
      .then(function(res) {
        if (res.data.error) console.error(error);
        else {
          list.entryIDs.push(entry.index);
          callback({ addedToList: true });
        }
      }, function(res) { console.error(res); });
    }
  };

  //  remove from a list
  var removeFromList = function(list, entry, callback) {
    var index = list.entryIDs.indexOf(entry.index);
    $http.post('/api/lists/removefromlist', {
      listID: list._id,
      entryIndex: entry.index
    })
    .then(function(res) {
      if (res.data.error) console.error(res.data.error);
      else {
        list.entryIDs.splice(index, 1);
        callback();
      }
    }, function(res) { console.error(res); });
  };

  //  do initial list download
  $http.post('/api/lists/mylists', {
    username: $rootScope.currentUser.username
  })
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else sharedListModel.myLists = res.data.entries;
    sharedListModel.listsLoading = false;
  }, function(res) { console.error(res); });

  //  return service's public fields
  return {
    sharedListModel: sharedListModel,
    newList: newList,
    deleteList: deleteList,
    addToList: addToList,
    removeFromList: removeFromList
  };

})


/*
*   List view controller
*/

app.controller('ListsCtrl', function($scope, $http, savedListService) {

    //  initialize view model
    var viewModel = {
        newListName: '',
        selectedList: null,
        selectedListEntries: null
    };

    //  expose view model to scope
    $scope.viewModel = viewModel;

    //  expose shared list model to scope
    $scope.sharedListModel = savedListService.sharedListModel

    //  functions for list modification
    $scope.newList = function() {
        savedListService.newList(viewModel.newListName, function(list) {
            viewModel.newListName = '';
            $scope.selectList(list);
            console.log('list created: ' + list.name);
        });
    };

    $scope.deleteList = function() {
        savedListService.deleteList(viewModel.selectedList, function() {
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

    $scope.removeSelectedEntriesFromList = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            var entry = viewModel.selectedListEntries[i];
            if (entry.selected) {
                savedListService.removeFromList(viewModel.selectedList, entry, (function() {
                    var entry = this;
                    var index = viewModel.selectedListEntries.indexOf(entry);
                    viewModel.selectedListEntries.splice(index, 1);
                }).bind(entry));
            }
        }
    };

    $scope.duplicateList = function(name) {
        savedListService.newList(name, function(list) {
            console.log('list created: ' + list.name);
            for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
                var entry = viewModel.selectedListEntries[i];
                savedListService.addToList(list, entry, function(result) { return; });
            }
        }); 
    }

    //  export function copied from explore.js
    $scope.export = function(field, value) {
    
        var $btn = $('#export-button').button('loading')
    
        $http.post('/api/entries/export/', { index_list: viewModel.selectedList.entryIDs } )
        .success(function (res){

            var entries = d3.tsv.format(res.result.entries);
            var activities = d3.tsv.format(res.result.activities);
            var travels = d3.tsv.format(res.result.travels);

            var zip = new JSZip();
            zip.file("Entries.tsv", entries);
            zip.file("Activities.tsv", activities);
            zip.file("Travels.tsv", travels);
            var content = zip.generate({type:"blob"});
            saveAs(content, "Grand Tour Explorer - Export.zip");
            $btn.button('reset')

        })
    }
    
});