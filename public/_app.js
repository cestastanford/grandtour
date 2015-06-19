'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', ['ui.router'])
  .config(function($routeProvider, $locationProvider, $httpProvider, $stateProvider, $urlRouterProvider) {
    //================================================
    // Check if the user is connected
    //================================================
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
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
          $rootScope.message = 'You need to log in.';
          //$timeout(function(){deferred.reject();}, 0);
          deferred.reject();
          $location.url('/login');
        }
      });

      return deferred.promise;
    };
    //================================================

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function($q, $location) {
      return {
        response: function(response) {
          // do something on success
          return response;
        },
        responseError: function(response) {
          if (response.status === 401)
            $location.url('/login');
          return $q.reject(response);
        }
      };
    });
    //================================================

    //================================================
    // Define all the routes
    //================================================
    /*$routeProvider
      .when('/', {
        templateUrl: 'views/main'
      })
      .when('/admin', {
        templateUrl: 'views/admin',
        controller: 'AdminCtrl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .when('/register', {
        templateUrl: 'views/register',
        controller: 'RegisterCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login',
        controller: 'LoginCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });*/

      $urlRouterProvider.otherwise("/");

      // Now set up the states
      $stateProvider
        .state('main', {
          url: "/",
          templateUrl: "views/main"
        })
        .state('admin', {
          url: "/admin",
          templateUrl: "views/admin",
          controller: "AdminCtrl",
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


      //$locationProvider.html5Mode(true);

    //================================================

  }) // end of config()
  .run(function($rootScope, $http, $location){
    $rootScope.message = '';

    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.message = 'Logged out.';
      $rootScope.currentUser = null;
      $http.post('/logout');
      //$location.url('/login');
    };
  });
