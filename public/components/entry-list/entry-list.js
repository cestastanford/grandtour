export default ['savedListService', 'entryListContext', '$filter', function(savedListService, entryListContext, $filter) {
  
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
    template: require('pug-loader!./entry-list.pug'),
    link: function(scope, element, attributes) {

      //  Saves entry list view to entryListContext service
      var saveEntryListContext = function() {
        var sortedEntries = $filter('orderBy')(scope.entries, scope.sortModel.current.sortFn, scope.sortModel.reversed)
        entryListContext.saveContext(sortedEntries, attributes.isSavedListView)
      }

      scope.$watchCollection('entries', saveEntryListContext)
      scope.$watch('sortModel', saveEntryListContext, true)

      //  initialize view model
      var viewModel = {
          newListName: ''
      };

      //  expose view model to scope
      scope.viewModel = viewModel;

      //  expose shared list model to scope
      scope.sharedListModel = savedListService.sharedListModel

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
            savedListService.addToList(list, entry, (function(result) {
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
        savedListService.newList(viewModel.newListName, function(list) {
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

      var sortOptions = [
        { label: 'Index', sortFn: function(entry) { return entry.index ? entry.index : 0.1 } },
        { label: 'Full Name', sortFn: function(entry) { return entry.fullName } },
        { label: 'Date of first travel', sortFn: function(entry) { return entry.dateOfFirstTravel } },
      ]

      scope.sortModel = {
        options: sortOptions,
        current: sortOptions[0],
        reversed: false,
      };

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
}];