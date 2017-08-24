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
  var myListsPromise = $http.post('/api/lists/mylists', {
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
    removeFromList: removeFromList,
    myListsPromise: myListsPromise,
  };

})
