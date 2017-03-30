'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', [
    'ngSanitize',
    'ngAnimate',
    'ui.router',
    'ui.bootstrap',
])

.run(
  function ($rootScope, $state, $stateParams, $http) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $http.get('/loggedin').success(function(user){
      // Authenticated
      if (user !== '0') {
        $rootScope.currentUser = user;
      } else {
        console.log(user)
      }
    });

    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.currentUser = null;
      $http.post('/logout');
      $state.go('login')
    };
  }
)

.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

  var checkLoggedin = function($q, $timeout, $http, $location, $rootScope, $state){
    // Initialize a new promise
    var deferred = $q.defer();

    // Make an AJAX call to check if the user is logged in
    $http.get('/loggedin').success(function(user){
      // Authenticated
      if (user !== '0') {
        /*$timeout(deferred.resolve, 0);*/
        deferred.resolve();
        $rootScope.currentUser = user;
      }
      // Not Authenticated
      else {
        //$rootScope.message = 'You need to log in.';
        //$timeout(function(){deferred.reject();}, 0);
        deferred.reject();
        //$location.url('/login');
        $state.go('login')
      }
    });

    return deferred.promise;
  };

  var checkAdmin = function($q, $timeout, $http, $location, $rootScope, $state){
    // Initialize a new promise
    var deferred = $q.defer();

    // Make an AJAX call to check if the user is logged in
    $http.get('/loggedin').success(function(user){
      if (user !== '0' && user.role == 'admin') {
        deferred.resolve();
        $rootScope.currentUser = user;
      }
      else {
        deferred.reject();
        $state.go('home')
      }
    });

    return deferred.promise;
  };


  $urlRouterProvider.otherwise('/');

  $stateProvider

    .state('home', {
      url: "/",
      templateUrl: "views/main",
      resolve: {
        loggedin: checkLoggedin
      }
    })

    .state('about', {
      url: "/about",
      templateUrl: "views/about",
      resolve: {
        loggedin: checkLoggedin
      }
    })

    .state('login', {
      url: "/login",
      templateUrl: "views/login",
      controller: "LoginCtrl"
    })

    .state('register', {
      url: "/register",
      templateUrl: "views/register",
      controller: "RegisterCtrl"
    })

    .state('admin', {
      url: "/admin",
      templateUrl: "views/admin",
      controller: "AdminCtrl",
      resolve: {
        loggedin: checkAdmin
      }
    })

    .state('search', {
      url: "/search/:query",
      templateUrl: "views/search",
      controller: "SearchCtrl",
      resolve: {
        loggedin: checkLoggedin
      }
    })

    .state('explore', {
      url: "/explore/:query",
      templateUrl: "views/explore",
      controller: "ExploreCtrl",
      resolve: {
        loggedin: checkLoggedin
      }
    })

    .state('/entry', {
      url: "/entries/:id",
      templateUrl: "views/entry",
      controller: "EntryCtrl",
      resolve: {
        loggedin: checkLoggedin
      }
    })

    .state('lists', {
      url: "/lists",
      templateUrl: "views/lists",
      controller: "ListsCtrl",
      resolve: {
        loggedin: checkLoggedin
      }
    })

  //$locationProvider.html5Mode(true);


}) // end of config()

//  shared list management services
.factory('listService', function($rootScope, $http) {

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


//  shared service that highlights search terms in entries
.factory('entryHighlightingService', function() {

  //  private saved query
  var savedQuery = null;

  //  public query-saving function
  var saveQuery = function(query) {

    savedQuery = Object.assign({}, query);
    if (savedQuery.entry) {
        for (key in savedQuery.entry.sections) {
            savedQuery['entry_' + key] = savedQuery.entry.sections[key];
        }
        savedQuery.entry_beginnings = savedQuery.entry.beginnings;
        delete savedQuery.entry;
    }

  }

  //  public function that generates te highlighted HTML
  var highlightEntryProperty = function(propertyName, propertyValue) {

    var value = '' + propertyValue;
    var query = '' + (savedQuery && savedQuery[propertyName] || '');
    if (value && query) {

      var lowercaseValue = value.toLowerCase();
      var lowercaseQuery = query.toLowerCase();
      var segments = lowercaseValue.split(lowercaseQuery);

      if (propertyName.indexOf('entry_') > -1 && savedQuery.entry_beginnings === 'yes') {
          var regexp = new RegExp('\\s' + escapeRegExp(lowercaseQuery), 'g');
          segments = lowercaseValue.split(regexp);
      }

      var highlightEnd = value.length;
      while (segments.length > 1) {

        var segment = segments.pop()
        highlightEnd -= segment.length;
        var highlightStart = highlightEnd - lowercaseQuery.length;

        value = value.slice(0, highlightStart) +
            '<span class="highlighted">' +
            value.slice(highlightStart, highlightEnd) +
            '</span>' +
            value.slice(highlightEnd);

        highlightEnd = highlightStart;

      }

    }

    return value;

  }

  //  return public service properties
  return {
    highlight: highlightEntryProperty,
    saveQuery: saveQuery,
  }

});

//  regex-escaping function from controllers/entries.js
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
