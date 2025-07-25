export default ['$window', '$http', '$sce', '$timeout', function($window, $http, $sce, $timeout) {
  
    return {
        
        restrict: 'E',
        scope: true,
        template: function (elem, attrs) { return require('apply-loader!pug-loader!./' + attrs['template'] + '.pug') },
        link: function(scope, element, attributes) {
        
            
            /*
            *   Saves the field key from the directive attributes.
            */

            scope.fieldKey = attributes.fieldKey
            scope.facetTemplate = attributes.facetTemplate
            scope.$watch('entry.' + scope.fieldKey, function(value) {
                
                if (scope.entryFields) {
                    if (scope.entryFields[scope.fieldKey].serialized.isArrayOfValues) scope.fieldValueArray = value
                    else scope.fieldValue = value
                }

            }, true)


            /*
            *   Deletes an array item.
            */

            scope.deleteFromArray = function(item) {
                var index = scope.fieldValueArray.indexOf(item)
                scope.fieldValueArray.splice(index, 1)
                scope.edited(scope.fieldKey, scope.fieldValueArray)
            }

            /*
            *   Moves an array item up.
            */

            scope.moveUpInArray = function(item) {
                var index = scope.fieldValueArray.indexOf(item)
                if (index - 1 >= 0) {
                    scope.fieldValueArray[index] = scope.fieldValueArray[index - 1];
                    scope.fieldValueArray[index - 1] = item;
                    scope.edited(scope.fieldKey, scope.fieldValueArray)
                }
            }

            /*
            *   Moves an array item down.
            */

            scope.moveDownInArray = function(item) {
                var index = scope.fieldValueArray.indexOf(item)
                if (index + 1 < scope.fieldValueArray.length) {
                    scope.fieldValueArray[index] = scope.fieldValueArray[index + 1];
                    scope.fieldValueArray[index + 1] = item;
                    scope.edited(scope.fieldKey, scope.fieldValueArray)
                }
            }


            /*
            *   Adds a new array item.
            */

            scope.addToArray = function() {
                
                var newItem = {}
                scope.fieldValueArray.push(newItem)
                scope.edited(scope.fieldKey, scope.fieldValueArray)
                scope.editInModal(newItem, scope.fieldValueArray.length - 1)

            }


            /*
            *   Handles a resort of the array elements.
            */

            scope.arraySorted = function() {
                scope.edited(scope.fieldKey, scope.fieldValueArray)
            }


            /*
            *   Brings up a modal window for editing an object's properties
            *   or a primitive value.
            */

            scope.editInModal = function(value, valueArrayIndex) {

                var fieldKey = scope.fieldKey
                var entryField = scope.entryFields[fieldKey].serialized
                var modalModel = []
                if (entryField.valueIsObject) {

                    if (!value) value = {}
                    for (var key in entryField.type) {
                        
                        if (scope.entryFields[fieldKey].type[key] && scope.entryFields[fieldKey].type[key].enum) {

                            var enumValues = scope.entryFields[fieldKey].type[key].enum
                            modalModel.push({ name: key, type: entryField.type[key], enumValues: enumValues })

                        } else modalModel.push({ name: key, type: entryField.type[key], value: value[key] })
                    
                    }

                } else modalModel.push({ name: fieldKey, type: entryField.type, value: value })
                
                scope.modalModel = modalModel
                scope.modalSave = function() {

                    if (entryField.valueIsObject) modalModel.forEach(function(field) {
                        if (field.value || field.value === 0 || field.value === false) value[field.name] = field.value
                        else if (value[field.name]) delete value[field.name]
                    })

                    else value = modalModel[0].value
                    if (entryField.isArrayOfValues) {
                        scope.fieldValueArray[valueArrayIndex] = value
                        value = scope.fieldValueArray
                    }
                    
                    scope.edited(fieldKey, value)
                    delete scope.modalModel

                }

                scope.modalCancel = function() {
                    delete scope.modalModel
                }

            }


            /*
            *   Helper function to determine type of variable in expression.
            */

            scope.typeof = function(value) { return typeof value }


            /*
            *   Clears an object field.
            */

            scope.clearObjectField = function(fieldKey, arrayIndex, objectKey) {

                var object
                if (arrayIndex === null) object = scope.entry[fieldKey]
                else object = scope.entry[fieldKey][arrayIndex]
                delete object[objectKey]

                var value
                if (arrayIndex === null) value = object
                else value = scope.entry[fieldKey]
                scope.edited(fieldKey, value)

            }


            /*
            *   Downloads a Mentioned Name entry details.
            */

            var downloadedEntries = {}
            scope.downloadedEntries = downloadedEntries
            scope.downloadEntry = function(index) {

                if ((index || index === 0) && !downloadedEntries[index]) {
                    $http.get('/explorer/api/entries/' + index)
                    .then(function(response) {
                        downloadedEntries[index] = response.data.entry
                    })
                    .catch(console.error.bind(console))

                }

            }
            
        },
    
    }

}];