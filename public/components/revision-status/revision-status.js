app.directive('revisionStatus', function($http, $window) {
  return {

    restrict: 'E',
    templateUrl: 'components/revision-status',
    scope: {},
    link: function (scope, element) {

      function refreshRevisions() {

        $http.get('/loggedin')
        .then(function(response) {
          var user = response.data
          if (response.data.role === 'editor' || response.data.role === 'admin') {

            $http.get('/api/revisions')
            .then(function(response) {
              var revisions = response.data
              scope.revisions = [ { index: null, name: 'Latest' } ].concat(revisions)
              scope.activeRevision = scope.revisions.filter(revision => revision.index === user.activeRevisionIndex)[0]
              scope.activeRevision.active = true
              //scope.$apply()
            })

          }
        })
        .catch(console.error.bind(console))

      }

      scope.setActiveRevision = function(revision) {
        scope.activeRevision = revision
        $http.post('/api/users/update', { activeRevisionIndex: revision.index })
        .then(function(response) {
          refreshRevisions()
          $window.location.reload()
        })
        .catch(console.error.bind(console))
      }

      refreshRevisions()

    }
  };
});
