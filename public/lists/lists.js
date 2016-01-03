/**********************************************************************
 * Lists controller
***********************************************************************/

app.controller('ListsCtrl', function($scope, $http, listService) {

    //  initialize view model
    var viewModel = {
        newListName: '',
        selectedList: null,
        selectedListEntries: null
    };

    //  expose view model to scope
    $scope.viewModel = viewModel;

    //  expose shared list model to scope
    $scope.sharedListModel = listService.sharedListModel

    //  functions for list modification
    $scope.newList = function() {
        listService.newList(viewModel.newListName, function(list) {
            viewModel.newListName = '';
            viewModel.selectedList = list;
            console.log('list created: ' + list.name);
        });
    };

    $scope.deleteList = function() {
        listService.deleteList(viewModel.selectedList, function() {
            console.log('list deleted: ' + viewModel.selectedList.name);
            viewModel.selectedList = null;
        });
    };

    $scope.selectList = function(list) {
        if (viewModel.selectedList === list) viewModel.selectedList = null;
        else {
            viewModel.selectedList = list;
            viewModel.selectedListEntries = null;
            downloadEntries(list);
        }
    };

    function downloadEntries(list) {
        var entries = [];
        var entriesDownloaded = 0;
        if (!list.entryIDs.length) viewModel.selectedListEntries = entries;
        else for (var i = 0; i < list.entryIDs.length; i++) {
            var id = list.entryIDs[i];
            $http.get('/api/entries/' + id)
            .then((function(res) {
                if (res.data.error) console.error(error);
                else {
                    var i = this;
                    entries[i] = res.data.entry;
                    if (++entriesDownloaded === list.entryIDs.length) {
                        viewModel.selectedListEntries = entries;
                    }
                }
            }).bind(i), function(res) { console.error(res); });
        }
    };

    $scope.selectAllEntries = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            viewModel.selectedListEntries[i].selected = true;
        }
    };

    $scope.deselectAllEntries = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            viewModel.selectedListEntries[i].selected = false;
        }
    };

    $scope.removeSelectedEntriesFromList = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            var entry = viewModel.selectedListEntries[i];
            if (entry.selected) {
                listService.removeFromList(viewModel.selectedList, entry, (function() {
                    var entry = this;
                    var index = viewModel.selectedListEntries.indexOf(entry);
                    viewModel.selectedListEntries.splice(index, 1);
                }).bind(entry));
            }
        }
    };

    //  support for sorting entries
    var sortModel = {
      activeSortableDimensions: [
        { label : 'Fullname', sorting : 'fullName' },
        { label : 'Birth date', sorting : 'dates[0].birthDate' },
        { label : 'Birth place', sorting : 'places[0].birthPlace' },
        { label : 'Death date', sorting : 'dates[0].deathDate' },
        { label : 'Death place', sorting : 'places[0].deathPlace' },
      ],
      dimension: 'index',
      reverseSorting: false
    };

    $scope.sortModel = sortModel;

    //  export function copied from explore.js
    $scope.export = function(field, value){

      var $btn = $('#export-button').button('loading')

      $http.post('/api/entries/export/', { index_list: viewModel.selectedList.entryIDs } )
        .success(function (res){

          var entries = d3.tsv.format(res.result.entries);
          var activities = d3.tsv.format(res.result.activities);
          var travels = d3.tsv.format(res.result.travels);

          var zip = new JSZip();
          zip.file("Entries.tsv", entries);
          zip.file("Activities.tsv", activities);
          zip.file("Travels.tsv", travels);
          var content = zip.generate({type:"blob"});
          saveAs(content, "Grand Tour Explorer - Export.zip");
          $btn.button('reset')

        })



    }

});