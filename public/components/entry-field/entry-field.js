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
            console.log(scope.facetTemplate)


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
                var newObject = {}
                var save = function(updatedObject) {
                    array.push(updatedObject)
                    scope.edited(scope.fieldKey)
                }

                openObjectEditModal(newObject, save)

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

            scope.editObject = function(item) {
                scope.startEditing()
                var save = function(updatedObject) {
                    Object.assign(item, updatedObject)
                    scope.edited(scope.fieldKey)
                }

                openObjectEditModal(item, save)
            }


            /*
            *   Brings up a modal window for editing an object's properties.
            */

            function openObjectEditModal(originalObject, saveFn) {

                var type = scope.entryFields[scope.fieldKey].serializedValueType
                var modalModel = type.map(function(key) { return { name: key, value: originalObject[key] } })
                scope.modalModel = modalModel
                scope.modalSave = function() {
                    var updatedObject = {}
                    scope.modalModel.forEach(function(field) { updatedObject[field.name] = field.value })
                    delete scope.modalModel
                    saveFn(updatedObject)
                }

                scope.modalCancel = function() {
                    delete scope.modalModel
                }

            }

        },
    };
});
