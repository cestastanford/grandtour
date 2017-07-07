app.directive('entryField', function($window) {
  
    return {
        restrict: 'E',
        scope: {
            field: '=',
            value: '=',
            currentlyEditing: '=',
            startEditing: '&',
            edited: '&',
        },
        templateUrl: function (elem, attrs) { return 'components/entry-field/' + attrs['template'] },
        link: function(scope, element, attributes) {
        
            scope.handleClick = function() {

                scope.startEditing()
                var focusElement = element[0].querySelector('.focus')
                $window.setTimeout(function() { focusElement.focus() }, 0)

            }

        },
    };
});
