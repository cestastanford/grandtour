/*
*   List management service
*/

export default ['$rootScope', '$http', '$window', function($rootScope, $http, $window) {

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
    if ($window.confirm('Are you sure you want to permanently delete this list?')) {
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
    }
  };

  //  add to a list
  var addToList = function(list, entry, callback) {
    return $http.post('/api/lists/addtolist', {
      listID: list._id,
      entryIndex: entry.index
    })
    .then(function(res) {
      if (res.data.error) {
        console.error(error);
        throw error;
      }
      else {
        list.entryIDs = res.data.entryIDs;
        callback && callback({ addedToList: true });
        return {addedToList: true};
      }
    }, function(res) { console.error(res); });
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
  let myListsPromise;
  if ($rootScope.currentUser) {
    $http.post('/api/lists/mylists', {
      username: $rootScope.currentUser.username
    })
    .then(function(res) {
      if (res.data.error) console.error(res.data.error);
      else sharedListModel.myLists = res.data.entries;
      sharedListModel.listsLoading = false;
    }, function(res) { console.error(res); });
  } else {
    // If user is not logged in, do not do an initial list download
    // and populate sharedListModel with some empty data.
    myListsPromise = new Promise((resolve, reject) => {
      sharedListModel.myLists = [];
      sharedListModel.listsLoading = false;
      resolve(null);
    });
  }

  //  return service's public fields
  return {
    sharedListModel: sharedListModel,
    newList: newList,
    deleteList: deleteList,
    addToList: addToList,
    removeFromList: removeFromList,
    myListsPromise: myListsPromise,
  };

}];