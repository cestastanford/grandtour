export default function() {
    
    return {
    
        restrict: 'E',
        template: require('pug-loader!./pills.pug'),
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

            getPill.default = function(key, query, negative) {
                var pill = {}
                pill.dimension = key.split('_').join(' ')
                pill.value = query[key];
                return pill
            }

            /*
             * Pursuits pill - renamed to "Employments and Identifiers"
             */
            getPill.pursuits = function(key, query, negative) {
                let pill = getPill.default(key, query, negative);
                pill.dimension = "Employments and Identifiers";
                return pill;
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
                pill.dimension = 'free search in '
                pill.dimension += freeSearchQuery.sections.filter(function(section) { return section.checked })
                .map(function(section) { return section.name }).join(', ')
                
                pill.value = {
                    uniques: freeSearchQuery.terms.map(term => ({_id: term.value, negative: term.negative}) ),
                    operator: freeSearchQuery.operator
                };
                return pill;

            }


            /*
            *   Sets up pill updating based on query.
            */

    
            function setupPills() {

                scope.$watch('query', function(query) {
                  
                    scope.pills = []
                    for (let key in query) {
                        var pill = getPill[key] ? getPill[key](key, query) : getPill.default(key, query);
                        pill.key = key
                        scope.pills.push(pill)
                    }
                  
                }, true)

            }


            setupPills()
        

        },
    
    }

};