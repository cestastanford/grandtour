app.controller('EditEntryCtrl', function($http, $state, $stateParams, $scope, $window) {

    /*
    *   Downloads entry data.
    */

    function refreshEntry() {

        return $http.get('/api/entries/' + $stateParams.id)
        .then(function(response) {

            if (!response.data.entry) $state.go('entry', { id: $stateParams.id })
            else {
                $scope.entry = response.data.entry
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
    *   Opens the editor for a given field.
    */

    $scope.edit = function(fieldName) {

        $scope.currentlyEditing = fieldName
        var element = document.getElementById(fieldName)
        $window.setTimeout(function() { element.focus() }, 0)

    }


    /*
    *   Marks a field as edited.
    */

    $scope.edited = function(fieldName) {

        if (!$scope.unsavedChanges) $scope.unsavedChanges = {}
        $scope.unsavedChanges[fieldName] = true

    }


    /*
    *   Submits changes to the server.
    */

    $scope.saveChanges = function() {

        $scope.currentlyEditing = null
        $scope.saving = true
        var update = {}
        for (var fieldName in $scope.unsavedChanges) {
            update[fieldName] = $scope.entry[fieldName]
        }

        $http.patch('/api/entries/' + $scope.entry.index, update)
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


    refreshEntry()

});
