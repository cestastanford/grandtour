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
             * Generic date pill.
            */

            let datePill = dimension => (key, query) => {

                var travelQuery = query[key]
                var pill = {}
                pill.value = '';
                pill.dimension = dimension;

                if (travelQuery) {
    
                    if (travelQuery.startYear) pill.value += travelQuery.startYear
                    if (travelQuery.startMonth) pill.value += (travelQuery.startYear ? '/': '') + travelQuery.startMonth
                    
                    if (travelQuery.endYear && travelQuery.endYear !== travelQuery.startYear) {
                        if (travelQuery.endMonth && travelQuery.endMonth !== travelQuery.startMonth) {
                            pill.value = 'from ' + pill.value;
                            pill.value += ' until ' + (travelQuery.endYear ? '/': '') + travelQuery.endMonth
                        }
                        else {
                            pill.value = 'from ' + pill.value;
                            pill.value += ' until ' + travelQuery.endYear;
                        }
                    }
                    else if (travelQuery.endMonth && travelQuery.endMonth !== travelQuery.startMonth) {
                        pill.value += ' until ' + travelQuery.endMonth;
                        pill.value = 'from ' + pill.value;
                    }
                }

                return pill;

            }
            
            getPill.birthDate = datePill("birth date");
            getPill.deathDate = datePill("death date");
            getPill.travelDate = datePill("travel date");


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