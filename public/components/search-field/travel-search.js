app.directive('travelSearch', function() {
    
    return {
    
        restrict: 'E',
        templateUrl: 'components/search-field/travel-search',
        scope: true,
        link: function (scope) {
        
            /*
            *   Resets travel date model.  Calling with parameter
            *   range undefined copies main travel query to model.
            */

            scope.resetTravelSearch = function(range) {
                
                scope.travelModel = {
                    place: (scope.travelModel && scope.travelModel.place) || '',
                    date: {
                        range: !!range,
                        specifiedBy: (scope.travelModel && scope.travelModel.date && scope.travelModel.date.specifiedBy) || 'year',
                    },
                }
                
                if (range === undefined && scope.query.travel) {
                    
                    if (scope.query.travel.place) scope.travelModel.place = scope.query.travel.place
                    if (scope.query.travel.date) scope.travelModel.date = scope.query.travel.date
                
                }

            }

            
            /*
            *   Updates the travel model and main query in response
            *   to $watch or manual trigger.
            */

            function handleTravelSearchUpdate() {
                
                var placeSet = !!scope.travelModel.place
                var dateSet = false
                var dateFields = [ 'year', 'month', 'startYear', 'startMonth', 'endYear', 'endMonth' ]
                dateFields.forEach(function(key) {

                    if (scope.travelModel.date[key] || scope.travelModel.date[key] === null) dateSet = true
                    else delete scope.travelModel.date[key]

                })

                if (dateSet || placeSet) {
                    
                    scope.query.travel = scope.query.travel || {}
                    scope.query.travel.date = dateSet ? scope.travelModel.date : null
                    scope.query.travel.place = placeSet ? scope.travelModel.place : null
                
                } else delete scope.query.travel
            
            }

            
            /*
            *   Sets up travel model and links to main query object.
            */

            function setupTravelSearch() {

                scope.resetTravelSearch()
                scope.$watch('travelModel', handleTravelSearchUpdate, true)
                scope.$watch('query', function() { scope.resetTravelSearch() })

            }

            setupTravelSearch()
        
        },
    
    }

})