/*
*   Service for saving the entry list context (saved list, search 
*   result list) so navigation within context is possible from entry
*   view.
*/

app.factory('entryListContext', function($location) {
    
    /*
    *   Private variable for saving context.
    */

    var context = null


    /*
    *   Saves current entry list context.
    */

    var saveContext = function(entries, isSavedList) {

        var url = $location.url()
        var entryIndexes = entries && entries.map(function(entry) { return entry.index })
        if (entries && entries.length) context = {
            
            url: url,
            entryIndexes: entryIndexes,
            isSavedList: isSavedList,
        
        }

        else context = null

    }


    /*
    *   Returns the entry list context.
    */

    var getContext = function() { return context }


    /*
    *   Returns the previous entry given the current entry list context.
    */

    var getPreviousInContext = function(currentIndex) {

        if (!context) return null
        var index = context.entryIndexes.indexOf(+currentIndex)
        return index === 0 ? context.entryIndexes[context.entryIndexes.length - 1] : context.entryIndexes[index - 1]

    }


    /*
    *   Returns the enxt entry given the current entry list context.
    */

    var getNextInContext = function(currentIndex) {

        if (!context) return null
        var index = context.entryIndexes.indexOf(+currentIndex)
        return index === context.entryIndexes.length - 1 ? context.entryIndexes[0] : context.entryIndexes[index + 1]

    }


    /*
    *   Public service object
    */

    return {
        saveContext: saveContext,
        clearContext: function() { saveContext() },
        getContext: getContext,
        getPreviousInContext: getPreviousInContext,
        getNextInContext: getNextInContext,
    }

})
