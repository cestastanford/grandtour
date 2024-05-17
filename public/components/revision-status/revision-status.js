export default ['$http', function($http, $window) {
    
    return {
    
        restrict: 'E',
        template: require('pug-loader!./revision-status.pug'),
        scope: {},
        link: function (scope, element) {
        
          /*
          * Sets up Revisions tab.
          */
        
            function processRevisions(activeIndex) {
              
                scope.revisions.forEach(function(revision, i) {
                
                    revision.latest = i === 0
                    revision.active = revision.index === activeIndex || (revision.latest && !activeIndex)
                    if (revision.active) scope.activeRevision = revision
                
                })
                
                scope.revisions = scope.revisions
            
            }
            
            
            function reloadRevisions() {
              
                $http.get('/explorer/loggedin')
                .then(function(response) {
                    var currentUser = response.data
                    if (currentUser.role !== 'viewer') {

                        $http.get('/explorer/api/revisions')
                        .then(function(response) {
                            scope.revisions = response.data
                            processRevisions(currentUser.activeRevisionIndex)
                        })
                        .catch(console.error.bind(console))

                    }
                })
                .catch(console.error.bind(console))
            
            }
            
            scope.setActiveRevision = function(revision) {
                
                revision.activating = true
                $http.post('/explorer/api/users/update', { activeRevisionIndex: revision.latest ? null : revision.index })
                .then(function(response) {
                    revision.activating = false
                    $window.location.reload()
                })
                .catch(console.error.bind(console))
            
            }
            
            reloadRevisions()
        
        },
    
    }

}];