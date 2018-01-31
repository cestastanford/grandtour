app.directive('richTextEditor', function($window, $http, $sce, $timeout) {
  
    var FORMATTED_SUFFIX = '_formatted'

    return {
        
        restrict: 'E',
        scope: false,
        template: '<div class="editor" contenteditable="true"></div>',
        link: function(scope, element, attributes) {
            

            /*
            *   Loads content into rich text editor.
            */

            function loadContent() { 
                
                //  Retrieves formatted data for fieldKey
                var content = scope.entry && scope.entry[scope.fieldKey + FORMATTED_SUFFIX]
                if (!content) content = scope.entry && convertToRichText(scope.entry[scope.fieldKey])           
                instance.setData(content)
                scope.isEmpty = !content
            
            }


            /*
            *   Replaces line breaks with <p> elements for nodes
            *   that aren't yet rich text.
            */

            function convertToRichText(content) {

                if (content) {

                    if (content && content.indexOf('\n') > -1) {
                        content = content.split('\n').join('</p><p>')
                    }

                    if (content && scope.fieldKey === 'tours') {
                        content = content.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g).join('</p><p>')
                    }

                    content = '<p>' + content + '</p>'

                }

                return content

            }


            /*
            *   Handles rich text editor content change.
            */

            function handleChange() {
                
                var oldDataFormatted = scope.entry[scope.fieldKey + FORMATTED_SUFFIX]
                var oldDataUnformatted = scope.entry[scope.fieldKey]
                var newDataFormatted = instance.getData()
                var newDataUnformatted = instance.editable().getText()
                if (newDataUnformatted === '\n') newDataUnformatted = ''
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


            /*
            *   Initializes this editor field.
            */

            var editableElement = element[0].querySelector('.editor')
            var instance = CKEDITOR.inline(editableElement, {
                toolbarGroups: [ { name: 'basicstyles', group: 'basicstyles' } ],
            })

            instance.on('instanceReady', function() {
                if (scope.fieldValue) $timeout(loadContent)
                scope.$watch('entry', loadContent)
            })

            instance.on('change', function() {
                $timeout(handleChange)
            })

        },
    
    }

})