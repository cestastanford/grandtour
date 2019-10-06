import saveAs from "file-saver";
import JSZip from "jszip";
/*
*   List view controller
*/

export default ['$scope', '$http', 'savedListService', '$stateParams', '$state', function($scope, $http, savedListService, $stateParams, $state) {

    //  initialize view model
    var viewModel = {
        newListName: '',
        selectedList: null,
        selectedListEntries: null
    };

    //  expose view model to scope
    $scope.viewModel = viewModel;

    //  expose shared list model to scope
    $scope.sharedListModel = savedListService.sharedListModel

    savedListService.fetchLists();

    //  functions for list modification
    $scope.newList = function() {
        savedListService.newList(viewModel.newListName, function(list) {
            viewModel.newListName = '';
            $scope.selectList(list);
            console.log('list created: ' + list.name);
        });
    };

    $scope.deleteList = function() {
        savedListService.deleteList(viewModel.selectedList, function() {
            console.log('list deleted: ' + viewModel.selectedList.name);
            viewModel.selectedList = null;
        });
    };

    $scope.selectList = function(list) {
        if (viewModel.selectedList === list) {
          
          viewModel.selectedList = null;
          $state.go('lists', { id: null }, { notify: false })
        
        } else {
            
            $state.go('lists', { id: list._id }, { notify: false })
            viewModel.selectedList = list;
            viewModel.selectedListEntries = null;
            downloadEntries(list);
        
        }
    };

    function downloadEntries(list) {
        $http.get('/api/lists/' + list._id + '/entries')
        .then(function(response) {
            viewModel.selectedListEntries = response.data;
            viewModel.selectedList.entryIDs = response.data.map(e => e.index);
        })
        .catch(console.error.bind(console))
    };

    $scope.downloadEntries = downloadEntries;

    $scope.removeSelectedEntriesFromList = function() {
        for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
            var entry = viewModel.selectedListEntries[i];
            if (entry.selected) {
                savedListService.removeFromList(viewModel.selectedList, entry, (function() {
                    var entry = this;
                    var index = viewModel.selectedListEntries.indexOf(entry);
                    viewModel.selectedListEntries.splice(index, 1);
                }).bind(entry));
            }
        }
    };

    $scope.duplicateList = function(name) {
        savedListService.newList(name, function(list) {
            console.log('list created: ' + list.name);
            for (var i = 0; i < viewModel.selectedListEntries.length; i++) {
                var entry = viewModel.selectedListEntries[i];
                savedListService.addToList(list, entry, function(result) { return; });
            }
        }); 
    }

    //  export function copied from explore.js
    $scope.export = function(field, value) {
    
        var $btn = $('#export-button').button('loading')
    
        $http.post('/api/entries/export/', { index_list: viewModel.selectedList.entryIDs } )
        .success(function (res){

            var entries = d3.tsv.format(res.result.entries);
            var activities = d3.tsv.format(res.result.activities);
            var travels = d3.tsv.format(res.result.travels);

            var zip = new JSZip();
            zip.file("Travelers.tsv", entries);
            zip.file("Travelers_Life_Events.tsv", activities);
            zip.file("Travelers_Itineraries.tsv", travels);
            zip.file("LICENSE", "Data derived from Grand Tour Explorer, created by Giovanna Ceserani and Giorgio Caviglia, and populated with Giovanna Ceserani et als (2018), \"The Grand Tour Project Database: Travelers, Travelers Life Events and Travelers Itineraries.\" Stanford Digital Repository. Available at http://purl.stanford.edu/TBE, and licensed under a Creative Commons Attribution 3.0 Unported License.");
            var content = zip.generate({type:"blob"});
            saveAs(content, "Grand Tour Explorer - Export.zip");
            $btn.button('reset')

        })
    }

    //  Selects the list indicated by the URL, if it exists
    
    if ($stateParams.id) savedListService.fetchLists().then(function() {

        var list = savedListService.sharedListModel.myLists.filter(function(list) { return list._id === $stateParams.id })[0]
        if (list) $scope.selectList(list)
        else $state.go('lists', { id: null }, { notify: false })

    })
    
}];