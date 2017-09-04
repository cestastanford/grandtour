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
                savedQuery['entry_' + section.key] = savedQuery.entry.terms.map(function(term) { return term.value })
            })
            
            savedQuery.entry_beginnings = savedQuery.entry.beginnings
            delete savedQuery.entry
        
        }

        if (savedQuery.travel) {
            savedQuery.travel_place = savedQuery.travel.place
        }

    }


    /*
    *   Applies highlighting HTML to passed string.
    */

    var highlightString = function(needle, haystack, beginningsOnly) {

        var regExpStr = '(' + escapeRegExp(needle) + ')'
        if (beginningsOnly) {
            regExpStr = '(\\b|^)' + regExpStr
        }
        
        var regExp = new RegExp(regExpStr, 'gi')
        return haystack.replace(regExp, function(m, m1, m2) {
            if (beginningsOnly) return m1 + '<span class="highlighted">' + m2 + '</span>'
            else return '<span class="highlighted">' + m1 + '</span>'
        })

    }

    /*
    *   Highlights an entry field for each query term.
    */

    var highlightEntryProperty = function(propertyName, propertyValue) {

        var value = '' + propertyValue

        var queries = null
        if (savedQuery && savedQuery[propertyName]) {
            if (Array.isArray(savedQuery[propertyName]) && savedQuery[propertyName].length) {
                queries = savedQuery[propertyName].map(function(query) { return '' + query })
            } else queries = [ '' + savedQuery[propertyName] ]
        }

        if (propertyName === 'travel_place') {
            value = propertyValue.place
            if (!highlightTravel(propertyValue)) return value
        }

        if (value && queries) queries.forEach(function(query) {

            var beginningsOnly = propertyName.indexOf('entry_') > -1 && savedQuery.entry_beginnings
            value = highlightString(query, value, beginningsOnly)

        })

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
                    if (qT.date.year) {
                        qT.date.startYear = qT.date.year
                        qT.date.endYear = qT.date.year
                    }
                    if (qT.date.month) {
                        qT.date.startMonth = qT.date.month
                        qT.date.endMonth = qT.date.month
                    }
                    if (
                        (!qT.date.startYear || !t.travelEndYear || qT.date.startYear < t.travelEndYear || (qT.date.startYear === t.travelEndYear && (
                            !qT.date.startMonth || !t.travelEndMonth || qT.date.startMonth <= t.travelEndMonth
                        ))) && (!qT.date.endYear || !t.travelStartYear || qT.date.endYear > t.travelStartYear || (qT.date.endYear === t.travelStartYear && (
                            !qT.date.endMonth || !t.travelStartMonth || qT.date.endMonth >= t.travelStartMonth
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
