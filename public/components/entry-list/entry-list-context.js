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
    *   Returns the saved list context.
    */

    var getContext = function() { return context }


    /*
    *   Public service object
    */

    return {
        saveContext: saveContext,
        clearContext: function() { saveContext() },
        getContext: getContext,
    }

})
