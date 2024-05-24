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
import indexSearch from './components/search-field/index-search.js';
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
import { ChartComponent } from './chart.component';
import { MapComponent } from './map.component';

require("expose-loader?jQuery!jquery"); 
require("expose-loader?$!jquery");
require('bootstrap');

const LOGIN_REQUIRED = true;

/**********************************************************************
 * Angular Application
 **********************************************************************/
declare const BOOK_ORIGIN: string;
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
.directive('indexSearch', indexSearch)
.directive('freeSearch', freeSearch)
.directive('entryListContext', entryListContextBar)
.directive('entryList', entryList)
.service('entryListContext', entryListContextService)
.directive('adminGrid', downgradeComponent({component: GridComponent}))
.directive('chart', downgradeComponent({component: ChartComponent}))
.directive('map', downgradeComponent({component: MapComponent}))
.run(['$rootScope', '$state', '$stateParams', '$http', 
  function ($rootScope, $state, $stateParams, $http) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $http.get('/explorer/loggedin').then(function(user){
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
      $http.post('/explorer/logout');
      $state.go('login')
    };

    $rootScope.tutorialSteps = function() {
        return {
          'entry': [
            {src: 'tutorials/entry-1.jpg', prev: ['87%', '32%'], close: ['64%', '66%'], next: ['87%', '62.5%']},
            {src: 'tutorials/entry-2.jpg', prev: ['47%', '30.5%'], close: ['29.5%', '64.75%'], next: ['47%', '62.5%']},
            {src: 'tutorials/entry-3.jpg', prev: ['47%', '32%'], close: ['29.5%', '66%'], next: ['47%', '62.5%']},
            {src: 'tutorials/entry-4.jpg', prev: ['88%', '31%'], close: ['76%', '65%'], next: ['88%', '61.5%']},
            {src: 'tutorials/entry-5.jpg', prev: ['62%', '33.5%'], close: ['47.5%', '67.5%'], next: ['62%', '64.5%']},
            {src: 'tutorials/entry-6.jpg', prev: ['88%', '33.5%'], close: ['73.5%', '67.5%'], next: ['88%', '64.5%']},
            {src: 'tutorials/entry-7.jpg', prev: ['87%', '31%'], close: ['75%', '65%'], next: ['87%', '62%']},
            {src: 'tutorials/entry-8.jpg', prev: ['16.5%', '63%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'map': [
            {src: 'tutorials/map-1.jpg', prev: ['82%', '32%'], close: ['70%', '66%'], next: ['82%', '62.5%']},
            {src: 'tutorials/map-2.jpg', prev: ['45%', '49.5%'], close: ['36%', '83.5%'], next: ['45%', '80%']},
            {src: 'tutorials/map-3.jpg', prev: ['28.5%', '62.5%'], close: ['19.5%', '96.5%'], next: ['28.5%', '93%']},
            {src: 'tutorials/map-4.jpg', prev: ['80%', '36%'], close: ['68.5%', '70.25%'], next: ['80%', '67%']},
            {src: 'tutorials/map-5.jpg', prev: ['16.5%', '62.5%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'chart': [
            {src: 'tutorials/chart-1.jpg', prev: ['42%', '32%'], close: ['33.5%', '66%'], next: ['42%', '62.5%']},
            {src: 'tutorials/chart-2.jpg', prev: ['28%', '18.5%'], close: ['19.5%', '52.5%'], next: ['28%', '48.5%']},
            {src: 'tutorials/chart-3.jpg', prev: ['39.5%', '33.5%'], close: ['25.5%', '67.5%'], next: ['39.5%', '64%']},
            {src: 'tutorials/chart-4.jpg', prev: ['16.5%', '62.5%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'search': [
            {src: 'tutorials/search-1.jpg', prev: ['49%', '22%'], close: ['37%', '55.75%'], next: ['49%', '52%']},
            {src: 'tutorials/search-2.jpg', prev: ['41.5%', '30%'], close: ['30%', '64.25%'], next: ['41.5%', '61%']},
            {src: 'tutorials/search-3.jpg', prev: ['61.5%', '33.5%'], close: ['50%', '67.5%'], next: ['61.5%', '64%']},
            {src: 'tutorials/search-4.jpg', prev: ['13.5%', '62.5%'], close: ['7.5%', '96.5%'], next: ['13.5%', '93%']},
          ],
          'explore': [
            {src: 'tutorials/explore-1.jpg', prev: ['43%', '10.3%'], close: ['31%', '44.5%'], next: ['43%', '41%']},
            {src: 'tutorials/explore-2.jpg', prev: ['24.5%', '26%'], close: ['10%', '59.5%'], next: ['24.5%', '58%']},
            {src: 'tutorials/explore-3.jpg', prev: ['28%', '42%'], close: ['13.5%', '75.75%'], next: ['28%', '72%']},
            {src: 'tutorials/explore-4.jpg', prev: ['24.5%', '58%'], close: ['13%', '91.5%'], next: ['24.5%', '88%']},
            {src: 'tutorials/explore-5.jpg', prev: ['41%', '32%'], close: ['18%', '66%'], next: ['41%', '62%']},
            {src: 'tutorials/explore-6.jpg', prev: ['17%', '62%'], close: ['8%', '96%'], next: ['17%', '92%']},
          ],
      }[$state.current.name] || [];
    }

    $rootScope.showTutorial = function(e) {
      e.preventDefault();
      $rootScope.tutorialShown = true;
      $rootScope.tutorialStep = 1;
      return false;
    }

    $rootScope.hideTutorial = function(e) {
      e.preventDefault();
      $rootScope.tutorialShown = false;
      $rootScope.tutorialStep = 1;
      return false;
    }

    $rootScope.tutorialNext = function(e) {
      e.preventDefault();
      if ($rootScope.tutorialStep >= $rootScope.tutorialSteps().length) {
        $rootScope.tutorialShown = false;
      } else {
        $rootScope.tutorialStep++;
      }
      return false;
    }

    $rootScope.tutorialPrevious = function(e) {
      e.preventDefault();
      if ($rootScope.tutorialStep <= 1) {
        $rootScope.tutorialShown = false;
      } else {
        $rootScope.tutorialStep--;
      }
      return false;
    }

    $rootScope.getCurrent = function() {
      return $state.current && $state.current.name;
    }


    /*
    * Sets the page title based on the current route.
    */

    $rootScope.getTitle = function() {
      return 'The Grand Tour Explorer' + 
        ($state.current && $state.current.title ? ' – ' + $state.current.title : '')
    }

  }]
)
.run(function() {
  if (BOOK_ORIGIN && window.parent !== window) {
    window.addEventListener('hashchange', function(event) {
      window.parent.postMessage(
        { navigatedPath: location.pathname + location.hash },
        BOOK_ORIGIN,
      );
    });
  }
})
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  //  Retrieves the user object
  var getUser = function($http) {
    
    return $http.get('/explorer/loggedin')
    .then(function(response) {
      
      var user = response.data === '0' ? null : response.data
      return user
    
    })
    .catch(console.error.bind(console))
  
  }
  
  //  Checks that the user is logged in.
  var isLoggedIn = ['$http', '$rootScope', '$state', function($http, $rootScope, $state) {

    return false;
    // return getUser($http)
    // .then(function(user) {
    //   if (user) {
    //     $rootScope.currentUser = user
    //   }
    //   else {
        
    //     $rootScope.currentUser = null;
    //     // Redirect to 'login' if the user is not logged in.
    //     LOGIN_REQUIRED && $state.go('login');
    //     // The below code would not redirect to 'login' if the user is not logged in.
    //     // return null;
        
    //   }
    //   return user

    // })
    // .catch(console.error.bind(console))

  }];

  //  Checks that the user is an administrator.
  var isAdmin = ['$http', '$rootScope', '$state', function($http, $rootScope, $state) {
    
    return false;
    // return getUser($http)
    // .then(function(user) {
    //   if (user && user.role === 'admin') $rootScope.currentUser = user
    //   else if (LOGIN_REQUIRED) $state.go('home')
    //   return user

    // })
    // .catch(console.error.bind(console))

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

  // .state('lists', {
  //   url: "/lists/:id",
  //   template: require("pug-loader!./lists/lists.pug"),
  //   controller: ListsCtrl,
  //   title: 'Saved Lists',
  //   resolve: {
  //     loggedin: isLoggedIn
  //   }
  // })

  .state('chart', {
    url: "/chart",
    template: "<chart></chart>",
    title: 'View',
    resolve: {
      loggedin: isLoggedIn
    }
  })

  .state('map', {
    url: "/map",
    template: "<map></map>",
    title: 'View',
    resolve: {
      loggedin: isLoggedIn
    }
  })

}]);

export default MODULE_NAME;