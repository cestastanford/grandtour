export default function($state, entryListContext, entryHighlightingService) {
    
    return {
    
        restrict: 'E',
        template: require('pug-loader!./entry-list-context-bar.pug'),
        scope: {
            currentEntryIndex: '@',
            previousEntryIndex: '@',
            nextEntryIndex: '@',
            editing: '@?',
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

            scope.$watch('currentEntryIndex', setPreviousNext)
            scope.$watch('previousEntryIndex', setPreviousNext)
            scope.$watch('nextEntryIndex', setPreviousNext)


            //  Clears the entry list context and reloads
            scope.clearContext = function() {

                entryListContext.clearContext()
                entryHighlightingService.saveQuery(null)
                $state.reload()

            }

        }
    
    }

};