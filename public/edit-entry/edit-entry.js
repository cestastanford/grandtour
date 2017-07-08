app.controller('EditEntryCtrl', function($http, $state, $stateParams, $scope, $window) {


    /*
    *   Downloads the entry field schemas for rendering.
    */

    function refreshEntryFields() {

        return $http.get('/api/entry-fields')
        .then(function(response) {

            $scope.entryFields = response.data

        })
        .catch(console.error.bind(console))

    }


    /*
    *   Downloads entry data.
    */

    function refreshEntry() {

        return $http.get('/api/entries/' + $stateParams.id)
        .then(function(response) {

            if (!response.data.entry) $state.go('entry', { id: $stateParams.id })
            else {
                $scope.entry = response.data.entry
                console.log($scope.entry, $scope.entryFields)
                $scope.previous = response.data.previous
                $scope.next = response.data.next
            }

        })
        .catch(console.error.bind(console))

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

    $scope.edited = function(fieldKey) {

        if (!$scope.unsavedChanges) $scope.unsavedChanges = {}
        $scope.unsavedChanges[fieldKey] = $scope.entry[fieldKey]

    }


    /*
    *   Sets the currently-editing field.
    */

    $scope.setCurrentlyEditing = function(fieldKey) { $scope.currentlyEditing = fieldKey }


    /*
    *   Submits changes to the server.
    */

    $scope.saveChanges = function() {

        $scope.currentlyEditing = null
        $scope.saving = true
        $http.patch('/api/entries/' + $scope.entry.index, $scope.unsavedChanges)
        .then(function(response) {
            $scope.entry = response.data
            $scope.unsavedChanges = null
            $scope.saving = false
        })
        .catch(console.error.bind(console))

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
    *   Initially downloads assets and sets up inter-scope communication
    *   objects.
    */

    refreshEntryFields()
    .then(refreshEntry)
    .catch(console.error.bind(console))

});
