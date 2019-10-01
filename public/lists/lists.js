import saveAs from "file-saver";
import JSZip from "jszip";
import { find } from "lodash";

/*
*   List view controller
*/

export default ['$scope', '$http', 'savedListService', '$stateParams', '$state', function($scope, $http, savedListService, $stateParams, $state) {

    //  initialize view model
    var viewModel = {
        newListName: '',
        selectedList: null,
        selectedListEntries: null,
        sharedList: null,
    };

    //  expose view model to scope
    $scope.viewModel = viewModel;

    //  expose shared list model to scope
    $scope.sharedListModel = savedListService.sharedListModel

    //  functions for list modification
    $scope.newList = function() {
        savedListService.newList(viewModel.newListName, function(list) {
            viewModel.newListName = '';
            $scope.selectList(list._id);
            console.log('list created: ' + list.name);
        });
    };

    $scope.deleteList = function() {
        savedListService.deleteList(viewModel.selectedList, function() {
            console.log('list deleted: ' + viewModel.selectedList.name);
            viewModel.selectedList = null;
        });
    };

    $scope.selectList = function(listId) {
        $state.go('lists', { id: listId }, { notify: false })
        downloadEntries(listId);
    };

    function downloadEntries(listId) {
        $http.get('/api/lists/' + listId + '/entries')
        .then(function(response) {
            const {entries, ...list} = response.data;
            viewModel.selectedListEntries = entries;
            viewModel.selectedList = list;
            // Show list on frontend if it doesn't exist in myLists
            // (for example, if accessing someone else's list)
            if (!find(savedListService.sharedListModel.myLists, {_id: list._id})) {
                viewModel.sharedList = list;
            }
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

    // Fetch my lists, then select the list indicated by the URL.
    if ($stateParams.id) savedListService.myListsPromise.then(function() {
        $scope.selectList($stateParams.id);
    });
    
}];