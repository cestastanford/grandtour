app.directive('travelSearch', function() {
    
    return {
    
        restrict: 'E',
        templateUrl: 'components/search-field/travel-search',
        scope: true,
        link: function (scope) {
        
            /*
            *   Resets travel date model.
            */

            function resetTravelSearch(type) {
                
                scope.travelModel = { date: { queryType: type, query: {} }, place: '' }
                if (scope.query.travel) {
                    if (scope.query.travel.date) {
                        if (scope.query.travel.date.startYear !== scope.query.travel.date.endYear ||
                                scope.query.travel.date.startMonth !== scope.query.travel.date.endMonth ||
                                scope.query.travel.date.startDay !== scope.query.travel.date.endDay) {
                            scope.travelModel.date.queryType = 'range'
                        }
                        scope.travelModel.date.query = scope.query.travel.date
                    }
                    if (scope.query.travel.place) {
                        scope.travelModel.place = scope.query.travel.place
                    }
                
                }
            
            }

            
            /*
            *   Updates the travel model and main query in response
            *   to $watch or manual trigger.
            */

            function handleTravelSearchUpdate() {
                
                if (scope.travelModel.date.queryType === 'exact') {
                    scope.travelModel.date.query.endYear = scope.travelModel.date.query.startYear
                    scope.travelModel.date.query.endMonth = scope.travelModel.date.query.startMonth
                    scope.travelModel.date.query.endDay = scope.travelModel.date.query.startDay
                }
                
                for (key in scope.travelModel.date.query) if (!scope.travelModel.date.query[key]) delete scope.travelModel.date.query[key]
                if (Object.getOwnPropertyNames(scope.travelModel.date.query).length > 0) {
                    
                    scope.query.travel = scope.query.travel || { date: { queryType: scope.travelModel.date.queryType } }
                    scope.query.travel.date = scope.travelModel.date.query
                
                } else if (scope.query.travel) delete scope.query.travel.date
                
                if (scope.travelModel.place) {
                    
                    scope.query.travel = scope.query.travel || {}
                    scope.query.travel.place = scope.travelModel.place
                
                } else if (scope.query.travel) delete scope.query.travel.place
                
                if (scope.query.travel && !scope.query.travel.place && !scope.query.travel.date) delete scope.query.travel
            
            }

            
            /*
            *   Sets up travel model and links to main query object.
            */

            function setupTravelSearch() {

                resetTravelSearch('exact')
                scope.$watch('travelModel', handleTravelSearchUpdate, true)
                scope.$watch('query.travel', resetTravelSearch.bind(null, 'exact'), true)

            }

            setupTravelSearch()
        
        },
    
    }

})
