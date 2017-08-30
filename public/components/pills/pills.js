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
                var pill = {}
                pill.dimension = 'travel' +
                    (travelQuery.place ? ' place' : '') +
                    (travelQuery.place && travelQuery.date ? ' and' : '') +
                    (travelQuery.date ? ' date' : '') +
                    (travelQuery.date && travelQuery.date.range ? ' range' : '')

                pill.value = ''
                if (travelQuery.place) pill.value += travelQuery.place
                if (travelQuery.place && travelQuery.date) pill.value += ', '
                if (travelQuery.date) {

                    if (travelQuery.date.range) {

                        var startArr = [ 'from' ]
                        if (travelQuery.date.startMonth) startArr.push(MONTHS[travelQuery.date.startMonth])
                        if (travelQuery.date.startYear) startArr.push(travelQuery.date.startYear)
                        var startStr = startArr.length > 1 ? startArr.join(' ') : ''

                        var endArr = [ 'until' ]
                        if (travelQuery.date.endMonth) endArr.push(MONTHS[travelQuery.date.endMonth])
                        if (travelQuery.date.endYear) endArr.push(travelQuery.date.endYear)
                        var endStr = endArr.length > 1 ? endArr.join(' ') : ''
                        
                        pill.value += [ startStr, endStr ].filter(function(s) { return s }).join(' ')

                    } else {

                        var dateArr = []
                        if (travelQuery.date.month) dateArr.push(MONTHS[travelQuery.date.month])
                        if (travelQuery.date.year) dateArr.push(travelQuery.date.year)
                        pill.value += dateArr.join(' ')

                    }

                    if (travelQuery.date.specifiedBy !== 'year') pill.value += ' (specified by ' + travelQuery.date.specifiedBy + ')'

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
