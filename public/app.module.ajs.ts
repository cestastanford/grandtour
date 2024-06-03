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
            {src: 'tutorials/entry-1.png', alt: 'Welcome to an Explorer entry for one of 6,007 travelers in the database. In the middle, for all entries attested in the Dictionary, the original print text is reproduced in full; for entries extracted from narratives or from headings with multiple travelers, an explanation is provided in a dedicated box in the middle or by indicating the original heading, respectively.', prev: ['87%', '32%'], close: ['64%', '66%'], next: ['87%', '62.5%']},
            {src: 'tutorials/entry-2.png', alt: 'Biographical and indexical data for each traveler appear on the left, starting with a unique Entry ID. Click any blue text to get to all other travelers who share that value. For example, clicking 1757 will generate a list of all the other travelers who share that date of birth.', prev: ['47%', '30.5%'], close: ['29.5%', '64.75%'], next: ['47%', '62.5%']},
            {src: 'tutorials/entry-3.png', alt: 'Mentioned names are the people that appear in the entry; clickable names will take you to a list of all other entries in which the person is mentioned; clicking on a quote symbol will open that traveler’s entry. Italics indicate nonBritish (mostly Italians) who do not have entries.', prev: ['47%', '32%'], close: ['29.5%', '66%'], next: ['47%', '62.5%']},
            {src: 'tutorials/entry-4.png', alt: 'Sources show which sources are cited in the entry. Click a source to generate a list of all other entries which cite the same source. Hover over to see full title.', prev: ['88%', '31%'], close: ['76%', '65%'], next: ['88%', '61.5%']},
            {src: 'tutorials/entry-5.png', alt: 'The minimap shows on the map all locations visited by a traveler in Italy, sized by time spent in each. Click on “animate” to see the dots appearing on the map in the sequence of the travelers’ visits', prev: ['62%', '33.5%'], close: ['47.5%', '67.5%'], next: ['62%', '64.5%']},
            {src: 'tutorials/entry-6.png', alt: 'On the right, below the minimap, is the travel data, listing all locations of travel with dates. Click on a date to generate a list of all other travelers attested in the same place at the same time.', prev: ['88%', '33.5%'], close: ['73.5%', '67.5%'], next: ['88%', '64.5%']},
            {src: 'tutorials/entry-7.png', alt: 'At the bottom of the Entry’s text, you’ll find a link to the relevant Brinsley Ford archival records in the Paul Mellon Center for British Art', prev: ['87%', '31%'], close: ['75%', '65%'], next: ['87%', '62%']},
            {src: 'tutorials/entry-8.png', alt: 'Click the question mark at any time to replay this tutorial', prev: ['16.5%', '63%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'map': [
            {src: 'tutorials/map-1.png', alt: 'Welcome to the map of the Explorer. Here you can see the geographical scope of the travels. Zoom in and out for a more or less granular view; when you zoom in, more place names appear.', prev: ['84%', '32%'], close: ['70%', '66%'], next: ['84%', '62.5%']},
            {src: 'tutorials/map-2.png', alt: 'Different colors distinguish the historical eighteenth-century states to which each location belonged.', prev: ['49%', '30%'], close: ['40%', '68%'], next: ['49%', '65%']},
            {src: 'tutorials/map-3.png', alt: 'The search box lets you find each location recorded in the database.', prev: ['30.5%', '60%'], close: ['21.5%', '94%'], next: ['30.5%', '91%']},
            {src: 'tutorials/map-4.png', alt: 'Click over a place name to see in the Explorer page for a list of entries for travelers who are recorded to have been there.', prev: ['67%', '30.5%'], close: ['58%', '64.5%'], next: ['67%', '62%']},
            {src: 'tutorials/map-5.png', alt: 'Click the question mark at any time to replay this tutorial.', prev: ['16.5%', '62.5%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'chart': [
            {src: 'tutorials/chart-1.png', alt: 'Welcome to the chart view of the entries in the dataset, where each dot represents a traveler.', prev: ['42%', '32%'], close: ['33.5%', '66%'], next: ['42%', '62.5%']},
            {src: 'tutorials/chart-2.png', alt: 'Hovering over a dot reveals the name of the corresponding traveler, and clicking on it will take you to that traveler’s entry.', prev: ['28%', '18.5%'], close: ['19.5%', '52.5%'], next: ['28%', '48.5%']},
            {src: 'tutorials/chart-3.png', alt: 'Use the color, size, and group dropdown boxes to color, size, and group the entries by gender, word-length of the entry, and length and time of travel. Click “?” next to any dimension for more information.', prev: ['39.5%', '33.5%'], close: ['25.5%', '67.5%'], next: ['39.5%', '64%']},
            {src: 'tutorials/chart-4.png', alt: 'Click the question mark at any time to replay this tutorial.', prev: ['16.5%', '62.5%'], close: ['10.5%', '96.5%'], next: ['16.5%', '93%']},
          ],
          'search': [
            {src: 'tutorials/search-1.png', alt: 'Welcome to the Search page. Here you can discover the travelers’ entries and data by looking for specific values within each dimension.', prev: ['49%', '22%'], close: ['37%', '55.75%'], next: ['49%', '52%']},
            {src: 'tutorials/search-2.png', alt: 'As you add more dimensions and values to your search, the list of results will update  according to the increased specificity of your search.', prev: ['41.5%', '30%'], close: ['30%', '64.25%'], next: ['41.5%', '61%']},
            {src: 'tutorials/search-3.png', alt: 'You can sort the list results by Entry ID, full name, or first year of travel.  You can also read each entry or download the results as TSV data.', prev: ['61.5%', '33.5%'], close: ['50%', '67.5%'], next: ['61.5%', '64%']},
            {src: 'tutorials/search-4.png', alt: 'Click the question mark at any time to replay this tutorial.', prev: ['16.5%', '62.5%'], close: ['10.25%', '96.75%'], next: ['16.5%', '93%']},
          ],
          'explore': [
            {src: 'tutorials/explore-1.png', alt: 'Welcome to the Explore page. Here you can browse and filter traveler entries and data by dimension, and then view, sort, and download the results.', prev: ['43%', '10.3%'], close: ['31%', '44.5%'], next: ['43%', '41%']},
            {src: 'tutorials/explore-2.png', alt: 'Checking dimensions you want to explore in the left column will open corresponding boxes in the central pane. The number to the right of each dimension indicates the number of entries that include this value.', prev: ['24.5%', '26%'], close: ['10%', '59.5%'], next: ['24.5%', '58%']},
            {src: 'tutorials/explore-3.png', alt: 'Check the values you want to explore, and narrow or broaden your search by clicking “and” or  “or.” Exclude values by double clicking them. Use “#|A” to order the values alphabetically or numerically. Click “?” to learn more about a dimension.', prev: ['28%', '42%'], close: ['13.5%', '75.75%'], next: ['28%', '72%']},
            {src: 'tutorials/explore-4.png', alt: 'Selecting a value in one box will update other boxes to show only values for entries that also include the originally checked value.', prev: ['24.5%', '58%'], close: ['13%', '91.5%'], next: ['24.5%', '88%']},
            {src: 'tutorials/explore-5.png', alt: 'Scroll to the bottom of the central pane to see the results of your exploring. You will see the number of results, the values you searched by, and the option to sort results by Entry ID, full name, or first year of travel. You can also read each entry (by clicking on it) or download the results as TSV data (by clicking on Export results).', prev: ['40%', '32%'], close: ['20%', '66%'], next: ['40%', '62%']},
            {src: 'tutorials/explore-6.png', alt: 'Click the question mark at any time to replay this tutorial.', prev: ['18.5%', '62%'], close: ['12.5%', '96%'], next: ['18.5%', '92%']},
          ],
      }[$state.current.name] || [];
    }

    $rootScope.showTutorial = function(e) {
      e && e.preventDefault();
      $rootScope.tutorialShown = true;
      $rootScope.tutorialStep = 1;
      return false;
    }

    $rootScope.hideTutorial = function(e) {
      e && e.preventDefault();
      $rootScope.tutorialShown = false;
      $rootScope.tutorialStep = 1;
      return false;
    }

    $rootScope.tutorialNext = function(e) {
      e && e.preventDefault();
      if ($rootScope.tutorialStep >= $rootScope.tutorialSteps().length) {
        $rootScope.tutorialShown = false;
      } else {
        $rootScope.tutorialStep++;
      }
      return false;
    }

    $rootScope.tutorialPrevious = function(e) {
      e && e.preventDefault();
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

    // setTimeout(() => {
    //   if ($rootScope.tutorialSteps().length) {
    //     let title = $rootScope.getTitle();
    //     if (!localStorage.getItem(title)) {
    //       $rootScope.showTutorial();
    //       localStorage.setItem(title, "1");
    //     }
    //   }
    // }, 500);


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