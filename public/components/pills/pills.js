app.filter('isArray', function() {
  return function (input) {
    return angular.isArray(input);
  };
})

.directive('pills', function() {
    
    var MONTHS = [ null, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
    return {
    
        restrict: 'E',
        templateUrl: 'components/pills',
        scope: true,
        link: function(scope, element, attributes) {


            /*
            *   Exposes whether the pill should allow removing from query.
            */

            scope.allowRemove = attributes.allowRemove


            /*
            *   Map query keys to pill functions.
            */

            var getPill = {}


            /*
            *   Returns a default pill.
            */

            getPill.default = function(key, query) {
                var pill = {}
                pill.dimension = key.split('_').join(' ')
                pill.value = query[key]
                return pill
            }


            /*
            *   Returns a Travel pill.
            */

            getPill.travel = function(key, query) {

                var travelQuery = query[key]
                var valueArray = []
                if (travelQuery.place) valueArray.push(travelQuery.place)
                if (travelQuery.date) {

                    var dateArray = []
                    if (travelQuery.date.month) dateArray.push(MONTHS[travelQuery.date.month])
                    if (travelQuery.date.year) dateArray.push(travelQuery.date.year)
                    if (travelQuery.date.monthEmpty) dateArray.push('(month empty)')
                    if (travelQuery.date.yearEmpty) dateArray.push('(year empty)')
                    if (travelQuery.date.startMonth || travelQuery.date.startYear) dateArray.push('from')
                    if (travelQuery.date.startMonth) dateArray.push(MONTHS[travelQuery.date.startMonth])
                    if (travelQuery.date.startYear) dateArray.push(travelQuery.date.startYear)
                    if (travelQuery.date.endMonth || travelQuery.date.endYear) dateArray.push('until')
                    if (travelQuery.date.endMonth) dateArray.push(MONTHS[travelQuery.date.endMonth])
                    if (travelQuery.date.endYear) dateArray.push(travelQuery.date.endYear)                        
                    if (dateArray.length) valueArray.push(dateArray.join(' '))

                    if (travelQuery.date.specifiedBy !== 'year') {
                        valueArray.push('specified by ' + travelQuery.date.specifiedBy)
                    }

                }

                return { dimension: 'travel', value: valueArray.join(', ') }

            } 


            /*
            *   Returns a Free Search pill.
            */

            getPill.entry = function(key, query) {
                
                var freeSearchQuery = query[key]
                var pill = {}
                pill.dimension = 'free search in '
                pill.dimension += freeSearchQuery.sections.filter(function(section) { return section.checked })
                .map(function(section) { return section.name }).join(', ')
                
                pill.value = freeSearchQuery.terms.map(function(term) { return term.value }).join(', ')
                return pill

            }


            /*
            *   Sets up pill updating based on query.
            */

    
            function setupPills() {

                scope.$watch('query', function(query) {
                  
                    scope.pills = []
                    for (key in query) {
                        var pill = getPill[key] ? getPill[key](key, query) : getPill.default(key, query)
                        pill.key = key
                        scope.pills.push(pill)
                    }
                  
                }, true)

            }


            setupPills()
        

        },
    
    }

})
