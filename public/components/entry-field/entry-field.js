app.directive('entryField', function($window, $http, $sce, $timeout) {
  
    var FORMATTED_SUFFIX = '_formatted'

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
                scope.startEditing()
                var index = scope.fieldValueArray.indexOf(item)
                scope.fieldValueArray.splice(index, 1)
                scope.edited(scope.fieldKey, scope.fieldValueArray)
            }


            /*
            *   Adds a new array item.
            */

            scope.addToArray = function() {
                
                scope.startEditing()
                var newItem = {}
                scope.fieldValueArray.push(newItem)
                scope.edited(scope.fieldKey, scope.fieldValueArray)
                scope.editInModal(newItem, scope.fieldValueArray.length - 1)

            }


            /*
            *   Handles a resort of the array elements.
            */

            scope.arraySorted = function() {
                scope.startEditing()
                scope.edited(scope.fieldKey, scope.fieldValueArray)
            }


            /*
            *   Brings up a modal window for editing an object's properties
            *   or a primitive value.
            */

            scope.editInModal = function(value, valueArrayIndex) {

                scope.startEditing()
                var fieldKey = scope.fieldKey
                var entryField = scope.entryFields[fieldKey].serialized
                var modalModel = []
                if (entryField.valueIsObject) {

                    if (!value) value = {}
                    for (var key in entryField.type) {
                        modalModel.push({ name: key, type: entryField.type[key], value: value[key] })
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

            scope.downloadMentionedNameEntry = function(mentionedName) {

                if (mentionedName.entryIndex || mentionedName.entryIndex === 0) {
                    $http.get('/api/entries/' + mentionedName.entryIndex)
                    .then(function(response) {
                        mentionedName.entry = response.data.entry
                    })
                    .catch(console.error.bind(console))

                } else delete mentionedName.entry

            }


            /*
            *   Initializes CKEDITOR for textarea fields.
            */

            if (attributes.template === 'entry-text') {
                
                //  Instantiates inline editor
                var editableElement = element[0].querySelector('.rich-text-editable')
                var instance = CKEDITOR.inline(editableElement, {
                    toolbarGroups: [ { name: 'basicstyles', group: 'basicstyles' } ],
                })
                
                //  Defines function for loading text into editor
                var loadData = function() { 
                    
                    //  Retrieves formatted data for fieldKey
                    var data = scope.entry && scope.entry[scope.fieldKey + FORMATTED_SUFFIX]
                    if (!data) {

                        //  If no formatted data, transforms unformatted data by replacing newlines with <p> tags
                        data = scope.entry && scope.entry[scope.fieldKey]
                        if (data && data.indexOf('\n') > -1) {
                            data = '<p>' + data.split('\n').join('</p><p>') + '</p>'
                        }

                    }
                                   
                    instance.setData(data)
                    scope.isEmpty = !data
                
                }

                //  Loads text into editor
                instance.on('instanceReady', function() {
                    if (scope.fieldValue) $timeout(loadData)
                    scope.$watch('entry', loadData)
                })

                //  Defines handler for changes to text
                var handleChange = function() {
                    
                    var oldDataFormatted = scope.entry[scope.fieldKey + FORMATTED_SUFFIX]
                    var oldDataUnformatted = scope.entry[scope.fieldKey]
                    var newDataFormatted = instance.getData()
                    var newDataUnformatted = instance.editable().getText()
                    if (scope.fieldKey === 'fullName') {
                        
                        if (oldDataUnformatted !== newDataUnformatted) {
                            scope.edited(scope.fieldKey, newDataUnformatted)
                            scope.isEmpty = !newDataUnformatted
                        }
                    
                    } else if (oldDataFormatted !== newDataFormatted) {
                        
                        scope.edited(scope.fieldKey, newDataUnformatted, newDataFormatted)
                        scope.isEmpty = !newDataFormatted
                    
                    }
                
                }

                //  Attaches handler
                instance.on('change', function() {
                    $timeout(handleChange)
                })

            }
            
        },
    };
});
