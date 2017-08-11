/*
* Entry highlighting service
*/

app.factory('entryHighlightingService', function() {

  //  private saved query
  var savedQuery = null;

  //  public query-saving function
  var saveQuery = function(query) {

    savedQuery = Object.assign({}, query);
    if (savedQuery.entry) {
      savedQuery.entry.sections.map(function(section) {
        savedQuery['entry_' + section.key] = savedQuery.entry.terms.map(function(term) { return term.value })
      })
      savedQuery.entry_beginnings = savedQuery.entry.beginnings;
      delete savedQuery.entry;
    }
    if (savedQuery.travel) {
        savedQuery.travel_place = savedQuery.travel.place;
    }

  }

  //  private string-highlighting function
  var highlightString = function(needle, haystack, beginningsOnly) {

    var regExpStr = '(' + escapeRegExp(needle) + ')';
    if (beginningsOnly) {
      regExpStr = '(\\b|^)' + regExpStr;
    }
    var regExp = new RegExp(regExpStr, 'gi');
    return haystack.replace(regExp, function(m, m1, m2) {
      if (beginningsOnly) return m1 + '<span class="highlighted">' + m2 + '</span>';
      else return '<span class="highlighted">' + m1 + '</span>';
    });

  }

  //  public function that generates te highlighted HTML
  var highlightEntryProperty = function(propertyName, propertyValue) {

    var value = '' + propertyValue;

    var queries = null;
    if (savedQuery && savedQuery[propertyName]) {
      if (Array.isArray(savedQuery[propertyName]) && savedQuery[propertyName].length) {
        queries = savedQuery[propertyName].map(function(query) { return '' + query; });
      } else queries = [ '' + savedQuery[propertyName] ];
    }

    if (propertyName === 'travel_place') {
        value = propertyValue.place;
        if (!highlightTravel(propertyValue)) return value;
    }

    if (value && queries) queries.forEach(function(query) {

      var beginningsOnly = propertyName.indexOf('entry_') > -1 && savedQuery.entry_beginnings;
      value = highlightString(query, value, beginningsOnly);

    });

    return value;

  }

  //  public function that determines whether a travel place or date should be
  //  highlighted
  var highlightTravel = function(travel) {
    if (travel && savedQuery && savedQuery.travel) {
      var qT = savedQuery.travel;
      var t = travel;
      if (qT.place.toLowerCase().indexOf(t.place.toLowerCase()) > -1) {
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
            return true;
          }
        } else return true;
      }
    }
    return false;
  }

  //  return public service properties
  return {
    highlight: highlightEntryProperty,
    highlightTravel: highlightTravel,
    saveQuery: saveQuery,
  }

});

//  regex-escaping function from controllers/entries.js
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


