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
      url: "/explore/",
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

  //$locationProvider.html5Mode(true);


}) // end of config()
