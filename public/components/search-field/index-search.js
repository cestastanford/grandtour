export default function() {
    
    return {
    
        restrict: 'E',
        template: require('pug-loader!./index-search.pug'),
        scope: {
            title: "@",
            field: '@'
        },
        link: function (scope, elm, attrs) {
            window.scope = scope;
            /*
            *   Resets travel date model.
            */

            function resetTravelSearch(type) {
                
                scope.indexModel = { index: { queryType: type, query: {} } }
                if (scope.$parent.query[scope.field]) {
                    if (scope.$parent.query[scope.field]) {
                        if (scope.$parent.query[scope.field].startIndex !== scope.$parent.query[scope.field].endIndex
                            ) {
                            scope.indexModel.index.queryType = 'range'
                        }
                        scope.indexModel.index.query = scope.$parent.query[scope.field]
                    }
                
                }
            
            }

            
            /*
            *   Updates the travel model and main query in response
            *   to $watch or manual trigger.
            */

            function handleTravelSearchUpdate() {
                
                if (scope.indexModel.index.queryType === 'exact') {
                    scope.indexModel.index.query.endIndex = scope.indexModel.index.query.startIndex
                }
                
                for (let key in scope.indexModel.index.query) if (!scope.indexModel.index.query[key]) delete scope.indexModel.index.query[key]
                if (Object.getOwnPropertyNames(scope.indexModel.index.query).length > 0) {
                    
                    scope.$parent.query[scope.field] = scope.$parent.query[scope.field] || { index: { queryType: scope.indexModel.index.queryType } }
                    scope.$parent.query[scope.field] = scope.indexModel.index.query
                
                } else if (scope.$parent.query[scope.field]) delete scope.$parent.query[scope.field]
                
                if (scope.$parent.query[scope.field] && !scope.$parent.query[scope.field]) delete scope.$parent.query[scope.field]
            
            }


            function setupTravelSearch() {

                resetTravelSearch('exact')
                // scope.title = elm[0].dataset['title'];
                window.scope = scope;
                window.elm = elm;
                scope.$watch('indexModel', handleTravelSearchUpdate, true)

            }
            setupTravelSearch()

        
        },
    
    }

};