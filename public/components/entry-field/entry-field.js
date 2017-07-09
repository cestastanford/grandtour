app.directive('entryField', function($window) {
  
    return {
        restrict: 'E',
        scope: true,
        templateUrl: function (elem, attrs) { return 'components/entry-field/' + attrs['template'] },
        link: function(scope, element, attributes) {
        
            
            /*
            *   Saves the field key from the directive attributes.
            */

            scope.fieldKey = attributes.fieldKey
            scope.facetTemplate = attributes.facetTemplate
            scope.$watch('entry.' + scope.fieldKey, function(fieldValue) { scope.fieldValue = fieldValue }, true)


            /*
            *   Returns whether this field is the one currently
            *   being edited.
            */

            scope.isEditing = function() { return scope.currentlyEditing === scope.fieldKey }
            

            /*
            *   Sets this field as the one currently being edited.
            */

            scope.startEditing = function() {
                scope.setCurrentlyEditing(scope.fieldKey)
                var focusElement = element[0].querySelector('.focus')
                if (focusElement) $window.setTimeout(function() { focusElement.focus() }, 0)
            }


            /*
            *   Deletes an array item.
            */

            scope.deleteFromArray = function(item) {
                scope.startEditing()
                var array = scope.entry[scope.fieldKey]
                var index = array.indexOf(item)
                array.splice(index, 1)
                scope.edited(scope.fieldKey)
            }


            /*
            *   Adds a new array item.
            */

            scope.addToArray = function() {
                
                scope.startEditing()
                var array = scope.entry[scope.fieldKey]
                array.push({})
                scope.edited(scope.fieldKey)

            }


            /*
            *   Handles a resort of the array elements.
            */

            scope.arraySorted = function() {
                scope.startEditing()
                scope.edited(scope.fieldKey)
            }


            /*
            *   Edits an array item.
            */

            scope.editObject = function(object) {
                
                scope.startEditing()
                if (!object) {
                    object = {}
                    scope.entry[scope.fieldKey] = object
                }

                openObjectEditModal(object, function() {
                    scope.edited(scope.fieldKey)
                })
            
            }


            /*
            *   Brings up a modal window for editing an object's properties.
            */

            function openObjectEditModal(object, saveFn) {

                var type = scope.entryFields[scope.fieldKey].serializedValueType
                var modalModel = type.map(function(key) { return { name: key, value: object[key] } })
                scope.modalModel = modalModel
                scope.modalSave = function() {
                    modalModel.forEach(function(field) { object[field.name] = field.value })
                    delete scope.modalModel
                    saveFn()
                }

                scope.modalCancel = function() {
                    delete scope.modalModel
                }

            }

        },
    };
});
