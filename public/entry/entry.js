/*
* Entry view controller
*/

export default ['$scope', '$http', '$stateParams', '$sce', '$timeout', '$location', 'savedListService', 'MiniMapService', '$compile', '$interval', 'entryHighlightingService', '$window', '$state', '$rootScope', 'entryTransformationService', 'entryListContext', function($scope, $http, $stateParams, $sce, $timeout, $location, savedListService, MiniMapService, $compile, $interval, entryHighlightingService, $window, $state, $rootScope, entryTransformationService, entryListContext) {

  var viewModel = {
    newListName: ''
  }

  //  expose view model to scope
  $scope.viewModel = viewModel

  //  expose shared list model to scope
  $scope.sharedListModel = savedListService.sharedListModel

  savedListService.fetchLists();

  if ($stateParams.id) {
    
    $scope.id = parseInt($stateParams.id)
    $scope.currentUser = $rootScope.currentUser;
    $scope.loading = true;
    $http.get('/explorer/api/entries/' + $stateParams.id )
    .then(function(response) {
     
      $scope.previousIndex = response.data.previous
      $scope.nextIndex = response.data.next
      $scope.nextAvailableDecimalIndex = '' + (response.data.lastUsedDecimal + 0.1).toFixed(1)
      if (response.data.entry) {
        $scope.originalEntry = JSON.parse(JSON.stringify(response.data.entry))
        entryTransformationService.applyTransformations(response.data.entry).then(function(entry) {

          $scope.entry = entry
          $timeout(function(){ $('[data-toggle="tooltip"]').tooltip(); })
          setupMinimap();
          setupEditing();
          $scope.currentUser = $rootScope.currentUser;
          $scope.loading = false;

        })
        
      } else {

        setupEditing();
        $scope.loading = false;

      }
      
    })

  } else $state.go('home')

  $scope.highlighted = function(propertyName, value, doNotTrust) {
    if (value) {
      var highlightedHtml = entryHighlightingService.highlight(propertyName, value)
      return $sce.trustAsHtml(highlightedHtml)
    }
  }

  $scope.highlightTravel = entryHighlightingService.highlightTravel

  $scope.search = function(query){
    $location.path('search/' + JSON.stringify(query) );
  }

  $scope.searchTravel = function(travel) {

    var travelQuery = { place: travel.place };

    if (travel.travelStartYear || travel.travelEndYear) {

        travelQuery.date = {};

        if (travel.travelStartYear) {
          travelQuery.date.startYear = travel.travelStartYear;
          if (travel.travelStartMonth) {
            travelQuery.date.startMonth = travel.travelStartMonth;
            if (travel.travelStartDay) {
              travelQuery.date.startDay = travel.travelStartDay;
            }
          }
        }

        if (travel.travelEndYear) {
          travelQuery.date.endYear = travel.travelEndYear;
          if (travel.travelEndMonth) {
            travelQuery.date.endMonth = travel.travelEndMonth;
            if (travel.travelEndDay) {
              travelQuery.date.endDay = travel.travelEndDay;
            }
          }
        }

    }

    $location.path('search/' + JSON.stringify({ travelPlace: travelQuery.place, travelDate: travelQuery.date }));

  }

  function clean(obj){

    for (var key in obj) {
      if (!last(obj[key])) delete obj[key];
    }

    function last(o){
      for (var k in o) {
        if (typeof o[k] == 'object') return last(o[k]);
        else return /\S/.test(o.value) ? o[k] : null;
      }
    }

    return obj;
  }

  $scope.$watch( function(){ return $('.check-html').html(); }, function(html){
    $(".gte-popover").popover({
      html : true, 
      trigger: 'hover',
      placement: 'top',
      content: function() {
        return $("#" + $(this).attr('data-footnote')).html();
      }
    });
  })

  $scope.getMentionedNameSearchUrl = function (name) {
    let query = { "mentionedNames": name };
    return `/explorer/#/search/${encodeURIComponent(JSON.stringify(query))}`;
  }


  /*
  * Adds an entry to a list.
  */

  $scope.addSelectedEntriesToList = function(list) {
    var entry = $scope.entry
    entry.addedToList = entry.alreadyInList = false
    savedListService.addToList(list, entry, function(result) {
      if (result.addedToList) {
        entry.addedToList = true
      }
      if (result.alreadyInList) entry.alreadyInList = true
    })
  }


  /*
  * Adds an entry to a new list.
  */

  $scope.addSelectedEntriesToNewList = function() {
    savedListService.newList(viewModel.newListName, function(list) {
      viewModel.newListName = ''
      $scope.addSelectedEntriesToList(list)
    })
  }


  /*
  * Sets up Minimap.
  */  

  function setupMinimap() {

    if ($scope.entry.travels) {

      $scope.miniMapShared = MiniMapService.miniMapShared;
      $scope.miniMapShared.travels = $scope.entry.travels;

      var directiveHTML = '<traveler-points-mini-map></traveler-points-mini-map>';
      var miniMapElement = $compile(directiveHTML)($scope);

      var wrapperElement = angular.element(document.getElementById('minimap'));
      wrapperElement[0].innerHTML = '';
      wrapperElement.append(miniMapElement);

      doInitialAnimation($scope.entry.travels);
      $scope.reanimate = doRepeatAnimation;

    }

  }

  /*
  * Performs animation to imitate hovering over every element.
  */

  function doInitialAnimation(travels) {

    var ANIMATION_INTERVAL = 0; // no animation at start, just populate map
    var i = 0;

    $interval(next, ANIMATION_INTERVAL, travels.length + 1);

    function next() {

      if (i > 0) $scope.miniMapShared.travelUnhovered(travels[i - 1]);
      if (i < travels.length) $scope.miniMapShared.travelHovered(travels[i]);
      i++;

    };
  }

  function doRepeatAnimation(travels) {

    var ANIMATION_INTERVAL = 500;
    var i = 0;

    $interval(next, ANIMATION_INTERVAL, travels.length + 1);

    function next() {

      if (i > 0) $scope.miniMapShared.travelUnhovered(travels[i - 1]);
      if (i < travels.length) $scope.miniMapShared.travelHovered(travels[i]);
      i++;

    };
  }


  /*
  * Sets up the Edit bar for the entry.
  */

  function setupEditing() {

    $http.get('/explorer/loggedin')
    .then(function(response) {

      var user = response.data
      if (user.role === 'editor' || user.role === 'admin') {

        var editStatus = {}
        if (user.activeRevisionIndex !== null) editStatus.mustActivateLatest = true
        if ($scope.entry) editStatus.exists = true
        $scope.editStatus = editStatus

      }

    })

  }


  /*
  * Returns a link to an entry.
  */

  $scope.getEntryLink = function(index) {
    return typeof(index) !== "undefined" ? '/explorer/' + $state.href('entry', { id: index }) : ''
  }


  /*
  * Clears the navigation and highlighting context when navigating
  * to an entry.
  */

  $scope.handleEntryClick = function() {

    entryListContext.clearContext()
    entryHighlightingService.saveQuery()

  }


  /*
  * Creates a new entry with the current index.
  */

  $scope.createEntry = function() {

    $scope.editStatus.creating = true
    $http.put('/explorer/api/entries/' + $stateParams.id, { fullName: 'New Entry' })
    .then(function() {
      $scope.editStatus.creating = false
      $window.location.reload()
    })
    .catch(console.error.bind(console))

  }


  /*
  * Creates a duplicate of the current entry, with an index of the
  * next unused decimal of the current index.
  */

  $scope.duplicateEntry = function() {

    if ($window.confirm('Are you sure you want to duplicate this entry?  A new entry will be created with index ' + $scope.nextAvailableDecimalIndex + '.  All entry information will be copied to the new entry, and its Entry Origin will be set to "Extracted from narrative" and will reference the current entry.')) {
        
      $scope.editStatus.duplicating = true
      var newEntry = Object.assign({}, $scope.originalEntry, {
        
        index: $scope.nextAvailableDecimalIndex,
        fullName: $scope.entry.fullName + ' [duplicated]',
        origin: { 
          entryOrigin: 'Extracted from narrative',
          sourceIndex: $scope.entry.index,
        }
      
      })
      
      $http.put('/explorer/api/entries/' + $scope.nextAvailableDecimalIndex, newEntry)
      .then(function() {
        $scope.editStatus.duplicating = false
        $location.path('/entries/' + $scope.nextAvailableDecimalIndex)
      })
      .catch(console.error.bind(console))
    
    }

  }

}];