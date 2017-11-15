app.directive('entryLink', function($http, $state, entryListContext, entryHighlightingService) {
  
    return {
        
        restrict: 'E',
        scope: true,
        templateUrl: 'components/entry-field/entry-link',
        link: function(scope, element, attributes) {
            
            /*
            *   Downloads linked entry when attribute changes.
            */

            attributes.$observe('index', function(index) {
                
                if (scope.linkedEntryIndex !== index) {

                    scope.linkedEntry = null
                    scope.linkedEntryIndex = index
                    if (index || index === 0) {
                        
                        $http.get('/api/entries/' + index)
                        .then(function(response) {
                            scope.linkedEntry = response.data.entry
                        })
                        .catch(console.error.bind(console))

                    }

                }
                
            })


            /*
            *   Returns a link to an entry.
            */

            scope.getEntryLink = function(index) {

              return index ? $state.href('entry', { id: index }) : ''

            }


            /*
            *   Clears the navigation and highlighting context when navigating
            *   to an entry.
            */

            scope.handleEntryClick = function() {

                entryListContext.clearContext()
                entryHighlightingService.saveQuery()

            }

        },
    
    }

})
