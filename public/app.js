'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ngSanitize'
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
      $state.go('home')
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

  /*$httpProvider.interceptors.push(function($q, $location) {
    return {
      response: function(response) {
        // do something on success
        return response;
      },
      responseError: function(response) {
        if (response.status === 401)
          $state.go('login');
        return $q.reject(response);
      }
    };
  });*/



  $urlRouterProvider.otherwise('/');

  $stateProvider

    .state('home', {
      url: "/",
      templateUrl: "views/main"
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
        loggedin: checkLoggedin
      }
    })

    .state('entries', {
      url: "/entries",
      templateUrl: "views/entries",
      controller: "EntriesCtrl",
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

  //$locationProvider.html5Mode(true);


}) // end of config()
