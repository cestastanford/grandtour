import {uniqBy, pick} from "lodash";
export default ['$http', '$state', '$stateParams', '$scope', '$window', 'entryListContext', 'entryHighlightingService', function($http, $state, $stateParams, $scope, $window, entryListContext, entryHighlightingService) {

    var FORMATTED_SUFFIX = '_formatted'


    /*
    *   Downloads the entry field schemas for rendering.
    */

    function refreshEntryFields() {

        return $http.get('/explorer/api/entry-fields')
        .then(function(response) {

            $scope.entryFields = response.data

        })
        .catch(console.error.bind(console))

    }


    /*
    *   Downloads entry data.
    */

    function refreshEntry() {

        return $http.get('/explorer/api/entries/' + $stateParams.id)
        .then(function(response) {

            if (!response.data.entry) $state.go('entry', { id: $stateParams.id })
            else {
                $scope.entry = response.data.entry
                $scope.tours = uniqBy($scope.entry.travels.map(e => pick(e, ["tourIndex", "tourStartFrom", "tourEndFrom"])), e => e.tourIndex);
                $scope.previousIndex = response.data.previous
                $scope.nextIndex = response.data.next
            }

        })
        .catch(console.error.bind(console))

    }

    $scope.tourStartFromChange = function(index) {
        let tour = $scope.tours[index];
        for (let travel of $scope.entry.travels) {
            if (travel.tourIndex === tour.tourIndex) {
                travel.tourStartFrom = tour.tourStartFrom;
            }
        }
    }

    $scope.tourEndFromChange = function(index) {
        let tour = $scope.tours[index];
        for (let travel of $scope.entry.travels) {
            if (travel.tourIndex === tour.tourIndex) {
                travel.tourEndFrom = tour.tourEndFrom;
            }
        }
    }


    /*
    * Navigates to an entry's edit page.
    */

    $scope.getEditLink = function(index) {

        return index ? '/explorer/' + $state.href('edit-entry', { id: index }) : ''

    }


    /*
    * Navigates to an entry's edit page.
    */

    $scope.handleEditClick = function() {

        entryListContext.clearContext()
        entryHighlightingService.saveQuery()

    }


    /*
    *   Protects changes from leaving the site or visiting another page.
    */

    var message = 'Are you sure you want to leave the current page?  All unsaved changes will be lost.'

    $window.onbeforeunload = function() {
        if ($scope.unsavedChanges) return message
    }

    $scope.$on('$stateChangeStart', function(event) {
        if ($scope.unsavedChanges) {
            if (!confirm(message)) event.preventDefault()
        }
    })


    /*
    *   Marks a field as edited.
    */

    $scope.edited = function(fieldKey, newValue, newValueFormatted) {
        
        if (!$scope.unsavedChanges) $scope.unsavedChanges = {}
        $scope.unsavedChanges[fieldKey] = newValue
        $scope.entry[fieldKey] = newValue
        if (newValueFormatted !== undefined) {
            $scope.entry[fieldKey + FORMATTED_SUFFIX] = newValueFormatted
            $scope.unsavedChanges[fieldKey + FORMATTED_SUFFIX] = newValueFormatted
        }
        
        $scope.saved = false
        $scope.error = false
        $scope.errorMessage = null
    
    }


    /*
    *   Submits changes to the server.
    */

    $scope.saveChanges = function() {

        $scope.currentlyEditing = null
        $scope.saveStatus = { saving: true }
        $http.patch('/explorer/api/entries/' + $scope.entry.index, $scope.unsavedChanges)
        .then(function(response) {
            $scope.entry = response.data
            $scope.unsavedChanges = null
            $scope.saveStatus = { saved: true }
        })
        .catch(function(error) {
            console.error.bind(console)
            $scope.saveStatus = { error: error.data }
        })

    }


    /*
    *   Reverts changes to the last version.
    */

    $scope.revertChanges = function() {

        $scope.currentlyEditing = null
        if ($window.confirm('Are you sure you want to revert this entry to the last saved version?')) {
            $scope.reverting = true
            refreshEntry()
            .then(function() {
                $scope.unsavedChanges = null
                $scope.reverting = false
            })
            .catch(console.error.bind(console))
        }

    }


    /*
    * Deletes the current entry.
    */

    $scope.deleteEntry = function() {
      
        if ($window.confirm('Are you sure you want to delete this entry?')) {

            $scope.deleting = true
            delete $scope.unsavedChanges
            $http.delete('/explorer/api/entries/' + $scope.entry.index)
            .then(function() {
                $scope.deleting = false
                $window.location.reload()
            })
            .catch(console.error.bind(console))

        }

    }


    /*
    *   Initially downloads assets and sets up inter-scope communication
    *   objects.
    */

    refreshEntryFields()
    .then(refreshEntry)
    .catch(console.error.bind(console))

}];