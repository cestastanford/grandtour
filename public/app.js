'use strict';
import angular from 'angular';
import uiRouter from 'angular-ui-router';
import ngAnimate from 'angular-animate';
import "./app.css";

/**********************************************************************
 * Angular Application
 **********************************************************************/
const app = angular.module('app', [
  ngAnimate,
  uiRouter
  // 'ngSanitize',
  // 'ngAnimate',
  // 'ng-sortable',
  // 'ui.router',
  // 'ui.bootstrap',
]);

app.run(
  function ($rootScope, $state, $stateParams, $http) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $http.get('/loggedin').then(function(user){
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
    .success(function(user) {

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
    template: require("pug-loader!./main/main.pug"),
    title: 'Home',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('about', {
    url: "/about",
    template: require("pug-loader!./about/about.pug"),
    title: 'About',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('login', {
    url: "/login",
    template: require("pug-loader!./login/login.pug"),
    title: 'Login',
    controller: "LoginCtrl"
  })

  // .state('register', {
  //   url: "/register",
  //   template: require("pug-loader!./register/register.pug"),
  //   title: 'Register',
  //   controller: "RegisterCtrl"
  // })

  .state('admin', {
    url: "/admin",
    template: require("pug-loader!./admin/admin.pug"),
    controller: "AdminCtrl",
    title: 'Manage',
    resolve: {
      loggedin: isAdmin
    }
  })

  .state('search', {
    url: "/search/:query",
    template: require("pug-loader!./search/search.pug"),
    controller: "SearchCtrl",
    title: 'Search',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('explore', {
    url: "/explore/:query",
    template: require("pug-loader!./explore/explore.pug"),
    controller: "ExploreCtrl",
    title: 'Explore',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('edit-entry', {
    url: "/entries/:id/edit",
    template: require("pug-loader!./edit-entry/edit-entry.pug"),
    controller: "EditEntryCtrl",
    title: 'Edit Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('entry', {
    url: "/entries/:id",
    template: require("pug-loader!./entry/entry.pug"),
    controller: "EntryCtrl",
    title: 'Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('lists', {
    url: "/lists/:id",
    template: require("pug-loader!./lists/lists.pug"),
    controller: "ListsCtrl",
    title: 'Saved Lists',
    resolve: {
      loggedin: isLoggedIn
    }
  })

})

export default app;