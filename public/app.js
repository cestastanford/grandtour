'use strict';

/**********************************************************************
 * Angular Application
 **********************************************************************/
var app = angular.module('app', [
    'ngSanitize',
    'ngAnimate',
    'ng-sortable',
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


    /*
    * Sets the page title based on the current route.
    */

    $rootScope.getTitle = function() {
      return 'The Grand Tour Explorer' + 
        ($state.current && $state.current.title ? ' – ' + $state.current.title : '')
    }

  }
)

.config(function($stateProvider, $urlRouterProvider) {

  //  Retrieves the user object
  var getUser = function($http) {
    
    return $http.get('/loggedin')
    .then(function(response) {
      
      var user = response.data === '0' ? null : response.data
      return user
    
    })
    .catch(console.error.bind(console))
  
  }
  
  //  Checks that the user is logged in; redirects to 'login' if not
  var isLoggedIn = function($http, $rootScope, $state) {

    return getUser($http)
    .then(function(user) {

      if (user) $rootScope.currentUser = user
      else $state.go('login')
      return user

    })
    .catch(console.error.bind(console))

  }

  //  Checks that the user is an administrator; redirects to 'home' if not
  var isAdmin = function($http, $rootScope, $state) {

    return getUser($http)
    .then(function(user) {

      if (user && user.role === 'admin') $rootScope.currentUser = user
      else $state.go('home')
      return user

    })
    .catch(console.error.bind(console))

  }

  $urlRouterProvider.otherwise('/');

  $stateProvider
  .state('home', {
    url: "/",
    templateUrl: "views/main",
    title: 'Home',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('about', {
    url: "/about",
    templateUrl: "views/about",
    title: 'About',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('login', {
    url: "/login",
    templateUrl: "views/login",
    title: 'Login',
    controller: "LoginCtrl"
  })

  // .state('register', {
  //   url: "/register",
  //   templateUrl: "views/register",
  //   title: 'Register',
  //   controller: "RegisterCtrl"
  // })

  .state('admin', {
    url: "/admin",
    templateUrl: "views/admin",
    controller: "AdminCtrl",
    title: 'Manage',
    resolve: {
      loggedin: isAdmin
    }
  })

  .state('search', {
    url: "/search/:query",
    templateUrl: "views/search",
    controller: "SearchCtrl",
    title: 'Search',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('explore', {
    url: "/explore/:query",
    templateUrl: "views/explore",
    controller: "ExploreCtrl",
    title: 'Explore',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('edit-entry', {
    url: "/entries/:id/edit",
    templateUrl: "views/edit-entry",
    controller: "EditEntryCtrl",
    title: 'Edit Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('entry', {
    url: "/entries/:id",
    templateUrl: "views/entry",
    controller: "EntryCtrl",
    title: 'Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('lists', {
    url: "/lists/:id",
    templateUrl: "views/lists",
    controller: "ListsCtrl",
    title: 'Saved Lists',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('visualizations', {
    url: "/visualizations",
    templateUrl: "views/visualizations",
    controller: "VisualizationsCtrl",
    resolve: {
      loggedin: isLoggedIn
    }
  })

})
