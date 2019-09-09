'use strict';
import angular, { IDirectiveFactory } from 'angular';
import uiRouter from 'angular-ui-router';
import ngAnimate from 'angular-animate';
import LoginCtrl from './login/login.js';
import SignupCtrl from './signup/signup.js';
import AdminCtrl from './admin/admin.js';
import SearchCtrl from './search/search.js';
import ExploreCtrl from './explore/explore.js';
import EditEntryCtrl from './edit-entry/edit-entry.js';
import EntryCtrl from './entry/entry.js';
import ListsCtrl from './lists/lists.js';
import HttpQueryService from './explore/http-query-service.js';
import "./app.css";
import { travelerPointsMiniMap, MiniMapService, MiniMapController } from './entry/entry-minimap.js';
import entryTransformationService from './entry/entry-transformation.js';
import entryField from './components/entry-field/entry-field.js';
import richTextEditor from './components/entry-field/rich-text-editor.js';
import facet from './components/facet/facet.js';
import pills from './components/pills/pills.js';
import revisionStatus from './components/revision-status/revision-status.js';
import dateSearch from './components/search-field/date-search.js';
import freeSearch from './components/search-field/free-search.js';
import RegisterCtrl from './register/register.js';
import entryListContextBar from './components/entry-list/entry-list-context-bar.js';
import entryListContextService from './components/entry-list/entry-list-context-service.js';
import entryList from './components/entry-list/entry-list.js';
import listService from './lists/list-service.js';
import entryHighlighting from './entry/entry-highlighting.js';
import httpQueryService from './explore/http-query-service.js';
import { downgradeComponent } from '@angular/upgrade/static';
import { GridComponent } from './grid.component';
import { VisualizationComponent } from './visualization.component';

require("expose-loader?jQuery!jquery"); 
require("expose-loader?$!jquery");
require('bootstrap');

/**********************************************************************
 * Angular Application
 **********************************************************************/
const MODULE_NAME = 'app';
 const app = angular.module(MODULE_NAME, [
  ngAnimate,
  uiRouter,
  // 'ngSanitize',
  // 'ngAnimate',
  // 'ng-sortable',
  // 'ui.router',
  // 'ui.bootstrap',
])
.service('httpQuery', httpQueryService)
.service('entryHighlightingService', entryHighlighting)
.service('MiniMapService', MiniMapService)
.service('entryTransformationService', entryTransformationService)
.service('savedListService',  listService)
.directive('travelerPointsMiniMap', travelerPointsMiniMap)
.directive('entryField', entryField)
.directive('richTextEditor', richTextEditor)
.directive('facet', facet)
.filter('isArray', function() {
  return function (input) {
    return angular.isArray(input);
  };
})
.directive('pills', pills)
.directive('revisionStatus', revisionStatus)
.directive('dateSearch', dateSearch)
.directive('freeSearch', freeSearch)
.directive('entryListContext', entryListContextBar)
.directive('entryList', entryList)
.service('entryListContext', entryListContextService)
.directive('adminGrid', downgradeComponent({component: GridComponent}))
.directive('visualization', downgradeComponent({component: VisualizationComponent}))
.run(['$rootScope', '$state', '$stateParams', '$http', 
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

  }]
)

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

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
  var isLoggedIn = ['$http', '$rootScope', '$state', function($http, $rootScope, $state) {

    return getUser($http)
    .then(function(user) {
      if (user) $rootScope.currentUser = user
      else $state.go('login')
      return user

    })
    .catch(console.error.bind(console))

  }];

  //  Checks that the user is an administrator; redirects to 'home' if not
  var isAdmin = ['$http', '$rootScope', '$state', function($http, $rootScope, $state) {
    return getUser($http)
    .then(function(user) {
      if (user && user.role === 'admin') $rootScope.currentUser = user
      else $state.go('home')
      return user

    })
    .catch(console.error.bind(console))

  }];

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
    controller: LoginCtrl
  })

  .state('signup', {
    url: "/signup",
    template: require("pug-loader!./signup/signup.pug"),
    title: 'Signup',
    controller: SignupCtrl
  })

  // .state('register', {
  //   url: "/register",
  //   template: require("pug-loader!./register/register.pug"),
  //   title: 'Register',
  //   controller: RegisterCtrl
  // })

  .state('admin', {
    url: "/admin",
    template: require("pug-loader!./admin/admin.pug"),
    controller: AdminCtrl,
    title: 'Manage',
    resolve: {
      loggedin: isAdmin
    }
  })

  .state('search', {
    url: "/search/:query",
    template: require("pug-loader!./search/search.pug"),
    controller: SearchCtrl,
    title: 'Search',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('explore', {
    url: "/explore/:query",
    template: require("pug-loader!./explore/explore.pug"),
    controller: ExploreCtrl,
    title: 'Explore',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('edit-entry', {
    url: "/entries/:id/edit",
    template: require("pug-loader!./edit-entry/edit-entry.pug"),
    controller: EditEntryCtrl,
    title: 'Edit Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('entry', {
    url: "/entries/:id",
    template: require("pug-loader!./entry/entry.pug"),
    controller: EntryCtrl,
    title: 'Entry',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('lists', {
    url: "/lists/:id",
    template: require("pug-loader!./lists/lists.pug"),
    controller: ListsCtrl,
    title: 'Saved Lists',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('visualizations', {
    url: "/visualizations",
    template: "<visualization></visualization>",
    // controller: ListsCtrl,
    title: 'View',
    resolve: {
      loggedin: isLoggedIn
    }
  })

}]);

export default MODULE_NAME;