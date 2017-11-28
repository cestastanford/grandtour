/*
*   Entry highlighting service
*/

app.factory('entryHighlightingService', function() {

    /*
    *   Contains most recent query.
    */

    var savedQuery = null


    /*
    *   Saves most recent query to variable.
    */

    var saveQuery = function(query) {

        savedQuery = Object.assign({}, query)
        if (savedQuery.entry) {
            
            savedQuery.entry.sections.map(function(section) {
                savedQuery[section.key] = savedQuery.entry.terms
            })
            
            delete savedQuery.entry
        
        }

        if (savedQuery.travel) {
            savedQuery.travel_place = savedQuery.travel.place
        }

    }


    /*
    *   Applies highlighting HTML to passed string.
    */

    var highlightString = function(needle, haystack, beginning, end) {

        var regExpStr = '(' + escapeRegExp(needle) + ')'
        if (beginning) {
            regExpStr = '(?:\\b|^)' + regExpStr
        }

        if (end) {
            regExpStr = regExpStr + '(?:\\b|$)'
        }
        
        var regExp = new RegExp(regExpStr, 'gi')
        return haystack.replace(regExp, function(m, m1) {
            return '<span class="highlighted">' + m1 + '</span>'
        })

    }

    /*
    *   Highlights an entry field for each query term.
    */

    var highlightEntryProperty = function(propertyName, propertyValue, entryText) {

        var value = '' + propertyValue
        var queries = null
        
        if (propertyName === 'travel_place') {
            value = propertyValue.place
            if (!highlightTravel(propertyValue)) return value
        }

        if (savedQuery && savedQuery[propertyName]) {

            if (entryText) {
                savedQuery[propertyName].forEach(function(term) {
                    value = highlightString(term.value, value, term.beginning, term.end)
                })
            }

            else {

                if (Array.isArray(savedQuery[propertyName]) && savedQuery[propertyName].length) {
                    var queries = savedQuery[propertyName].map(function(query) { return '' + query })
                } else queries = [ '' + savedQuery[propertyName] ]

                if (value && queries) queries.forEach(function(query) {
                    value = highlightString(query, value)
                })

            }
        
        }

        return value

    }


    /*
    *   Determines whether a travel list item should be highlighted.
    */

    var highlightTravel = function(travel) {
        
        if (travel && savedQuery && savedQuery.travel) {
            var qT = savedQuery.travel
            var t = travel
            if (qT.place && qT.place.toLowerCase().indexOf(t.place.toLowerCase()) > -1) {
                if (qT.date) {
                    if (
                        (!qT.date.startYear || !t.travelEndYear || qT.date.startYear < t.travelEndYear || (qT.date.startYear === t.travelEndYear && (
                            !qT.date.startMonth || !t.travelEndMonth || qT.date.startMonth < t.travelEndMonth || (qT.date.startMonth < t.travelEndMonth && (
                                !qT.date.startDay || !t.travelEndDay || qT.date.startDay <= t.travelEndDay
                            ))
                        ))) && (!qT.date.endYear || !t.travelStartYear || qT.date.endYear > t.travelStartYear || (qT.date.endYear === t.travelStartYear && (
                            !qT.date.endMonth || !t.travelStartMonth || qT.date.endMonth > t.travelStartMonth || (qT.date.endMonth < t.travelStartMonth && (
                                !qT.date.endDay || !t.travelStartDay || qT.date.endDay >= t.travelStartDay
                            ))
                        )))
                    ) {
                        return true
                    }
                } else return true
            }
        }

        return false

    }


    /*
    *   Returns public functions.
    */

    return {
        highlight: highlightEntryProperty,
        highlightTravel: highlightTravel,
        saveQuery: saveQuery,
    }

})

//  regex-escaping function from controllers/entries.js
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}
