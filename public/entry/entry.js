/*
* Entry view controller
*/

app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce, $timeout, $location, savedListService, MiniMapService, $compile, $interval, entryHighlightingService, $window, $state, $rootScope, entryTransformationService, entryListContext) {

  if ($stateParams.id) {
    
    $scope.id = parseInt($stateParams.id)
    $scope.currentUser = $rootScope.currentUser;
    $scope.loading = true;
    $http.get('/api/entries/' + $stateParams.id )
    .then(function(response) {
     
      $scope.previousIndex = response.data.previous
      $scope.nextIndex = response.data.next
      if (response.data.entry) {
        entryTransformationService.applyTransformations(response.data.entry).then(function(entry) {

          $scope.entry = entry
          $timeout(function(){ $('[data-toggle="tooltip"]').tooltip(); })
          setupMinimap();
          setupLists();
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

    $location.path('search/' + JSON.stringify({ travel: travelQuery }));

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
    $(function () {
      $('[data-toggle="popover"]').popover({trigger:'hover', placement:'top', container:'body'});
    })
  })


  /*
  * Sets up list integration.
  */

  function setupLists() {

    var viewModel = {
        newListName: ''
    }

    //  expose view model to scope
    $scope.viewModel = viewModel

    //  expose shared list model to scope
    $scope.sharedListModel = savedListService.sharedListModel

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
      $scope.reanimate = doInitialAnimation;

    }

  }

  
  /*
  * Performs animation to imitate hovering over every element.
  */

  function doInitialAnimation(travels) {

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

    $http.get('/loggedin')
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
  * Navigates to an entry, clearing the navigation and highlighting
  * context.
  */

  $scope.goToEntry = function(index) {

    entryListContext.clearContext()
    entryHighlightingService.saveQuery()
    $state.go('entry', { id: index })

  }


  /*
  * Deletes the current entry.
  */

  $scope.deleteEntry = function() {
    
    if ($window.confirm('Are you sure you want to delete this entry?')) {
      
      $scope.editStatus.deleting = true
      $http.delete('/api/entries/' + $scope.entry.index)
      .then(function() {
        $scope.editStatus.deleting = false
        $window.location.reload()
      })
      .catch(console.error.bind(console))
    
    }

  }


  /*
  * Creates a new entry with the current index.
  */

  $scope.createEntry = function() {

    $scope.editStatus.creating = true
    $http.put('/api/entries/' + $stateParams.id, { fullName: 'New Entry' })
    .then(function() {
      $scope.editStatus.creating = false
      $window.location.reload()
    })
    .catch(console.error.bind(console))

  }

});