app.directive('entryList', function(listService) {
  
  return {
    restrict: 'E',
    scope: {
      entries: '=',
      export: '&',
      isSavedListView: '=?',
      removeSelectedEntriesFromList: '&?',
      duplicateList: '&?',
      deleteList: '&?',
    },
    templateUrl: 'components/entry-list',
    link: function(scope, element, attributes) {

      attributes.$observe('entries', function(entries) {
        if (scope.entries && scope.entries.length) calculateFirstTravelOrders(scope.entries);
      })
      if (scope.entries && scope.entries.length) calculateFirstTravelOrders(scope.entries);

      //  initialize view model
      var viewModel = {
          newListName: ''
      };

      //  expose view model to scope
      scope.viewModel = viewModel;

      //  expose shared list model to scope
      scope.sharedListModel = listService.sharedListModel

      //  selection/delection commands
      scope.selectAllEntries = function() {
        for (var i = 0; i < scope.entries.length; i++) {
          scope.entries[i].selected = true;
        }
      };

      scope.deselectAllEntries = function() {
        for (var i = 0; i < scope.entries.length; i++) {
          scope.entries[i].selected = false;
        }
      };

      scope.addSelectedEntriesToList = function(list) {
        for(var i = 0; i < scope.entries.length; i++) {
          var entry = scope.entries[i];
          if (entry.selected) {
            entry.addedToList = entry.alreadyInList = false;
            listService.addToList(list, entry, (function(result) {
              if (result.addedToList) {
                this.entry.addedToList = true;
              } else if (result.alreadyInList) {
                this.entry.alreadyInList = true;
              }
            }).bind({ entry: entry }));
          }
        }
      };

      scope.addSelectedEntriesToNewList = function() {
        listService.newList(viewModel.newListName, function(list) {
          viewModel.newListName = '';
          console.log('list created: ' + list.name);
          scope.addSelectedEntriesToList(list);
        });
      };

      scope.handleDuplicateListClick = function() {
        if (scope.duplicateList) scope.duplicateList({ name: viewModel.newListName });
        viewModel.newListName = '';
      }

      //  support for sorting entries
      var sortModel = {
        activeSortableDimensions: [
          { label : 'Fullname', sorting : 'fullName' },
          { label : 'Birth date', sorting : 'dates[0].birthDate' },
          { label : 'Birth place', sorting : 'places[0].birthPlace' },
          { label : 'Date of first travel', sorting : 'firstTravelUTC' },
        ],
        dimension: 'index',
        reverseSorting: false
      };

      scope.sortModel = sortModel;

      function calculateFirstTravelOrders(entries) {
        for (var i = 0; i < entries.length; i++) {

          var entry = entries[i];
          if (entry.travels) {

            for (var j = 0; j < entry.travels.length; j++) {

              var travel = entry.travels[j];
              if (travel.travelStartYear) {

                entry.firstTravelUTC = Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay);
                break;

              }
            }
          }
        }
      }

      //  support for pagination

      function resetPageModel() {
        scope.pageNumber = 0;
        scope.entriesPerPage = 25;
      }

      scope.$watchCollection('entries', resetPageModel);
      resetPageModel();

      scope.getPages = function() {
        var arr = [];
        if (scope.entries && scope.entries.length) {
          var nPages = scope.entriesPerPage ? Math.ceil(scope.entries.length / scope.entriesPerPage) : 1;
          for (var i = 0; i < nPages; i++) arr.push(i);
        }
        return arr;
      }

      scope.setPage = function(index) {
        if (index > -1 && index < scope.getPages().length) scope.pageNumber = index;
      }

      scope.isPage = function(index) {
        return scope.pageNumber === index;
      }

      scope.getStartPageLink = function() {
        if (scope.getPages().length > 9) {
          if (scope.pageNumber >= 5) {
            if (scope.pageNumber >= scope.getPages().length - 5) return scope.getPages().length - 9;
            else return scope.pageNumber - 4;
          }
        }
        return 0;
      }

      scope.setEntriesPerPage = function(n) {
        scope.entriesPerPage = n;
        scope.pageNumber = 0;
      }

    },
  };
});
