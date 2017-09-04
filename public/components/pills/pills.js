app.filter('isArray', function() {
  return function (input) {
    return angular.isArray(input);
  };
})

.directive('pills', function() {
    
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
                var pill = {}
                pill.dimension = 'travel '
                pill.value = ''

                if (travelQuery.place) {

                    if (travelQuery.date) {
                        pill.dimension += 'place and '
                        pill.value += (travelQuery.place + ', ')
                    } else {
                        pill.dimension += 'place'
                        pill.value += travelQuery.place
                    }

                }

                if (travelQuery.date) {

                    pill.dimension += 'date'
    
                    if (travelQuery.date.queryType === 'range') {
                        pill.dimension += ' range'
                        if (travelQuery.date.startYear) pill.value += 'from '
                    }
    
                    if (travelQuery.date.startYear) pill.value += travelQuery.date.startYear
                    if (travelQuery.date.startMonth) pill.value += '/' + travelQuery.date.startMonth
                    if (travelQuery.date.startDay)  pill.value += '/' + travelQuery.date.startDay
    
                    if (travelQuery.date.queryType === 'range') {
                        if (travelQuery.date.endYear) pill.value += ' until ' + travelQuery.date.endYear
                        if (travelQuery.date.endMonth) pill.value += '/' + travelQuery.date.endMonth
                        if (travelQuery.date.endDay) pill.value += '/' + travelQuery.date.endDay
                    }

                }

                return pill

            } 


            /*
            *   Returns a Free Search pill.
            */

            getPill.entry = function(key, query) {
                
                var freeSearchQuery = query[key]
                var pill = {}
                pill.dimension = 'free search in ' + freeSearchQuery.sections.filter(function(section) { return section.checked })
                .map(function(section) { return section.name }).join(', ')
                
                if (freeSearchQuery.beginnings) pill.dimension += ' (word beginnings only)'
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
