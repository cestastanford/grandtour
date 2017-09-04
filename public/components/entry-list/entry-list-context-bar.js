app.directive('entryListContext', function($state, entryListContext, entryHighlightingService) {
    
    return {
    
        restrict: 'E',
        templateUrl: 'components/entry-list/entry-list-context-bar',
        scope: {
            currentEntryIndex: '@',
            previousEntryIndex: '@',
            nextEntryIndex: '@',
            editing: '@?',
            noNavigation: '@?',
        },
        link: function(scope, element, attributes) {

            
            //  Retrieves entry list context for navigation
            scope.context = entryListContext.getContext()

            
            //  Sets the previous/next buttons based on context
            var setPreviousNext = function() {

                if (scope.context) {

                    scope.previous = entryListContext.getPreviousInContext(scope.currentEntryIndex)
                    scope.next = entryListContext.getNextInContext(scope.currentEntryIndex)

                } else {

                    scope.previous = scope.previousEntryIndex
                    scope.next = scope.nextEntryIndex

                }

            }

            if (!scope.noNavigation) {
                scope.$watch('currentEntryIndex', setPreviousNext)
                scope.$watch('previousEntryIndex', setPreviousNext)
                scope.$watch('nextEntryIndex', setPreviousNext)
            }


            //  Clears the entry list context and reloads
            scope.clearContext = function() {

                entryListContext.clearContext()
                entryHighlightingService.saveQuery(null)
                $state.reload()

            }

        }
    
    }

})
