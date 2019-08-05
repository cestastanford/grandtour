/*
 *  facet.js provides the functionality for the facet feature. Tools to explore filters are implemented here, including checkboxes, search
 *  operators, and sorting of a filter's options. Works with facet.pug.
 */

import {find, pick} from "lodash";

const DEFAULT_OPERATOR = "and";

function getUniquesRequestBody({field, suggestions, query, value}) {
  if (query[field] && query[field].operator === "or") {
    // When we have an OR query, for the field corresponding to the current
    // suggestions field, remove that field from the query. Otherwise,
    // it ends up essentially becoming an AND query.
    let {[field]: fieldPartOfQuery, ...restOfQuery} = query;
    query = restOfQuery;
  }
  return {suggestions, query, value};
}

export default ['$http', function($http) {
  return {

    scope : {
      label : '@',
      subgroup : '@',
      query : '=',
      field : '@',
      suggestions : '@'
    },

    template: require('pug-loader!./facet.pug'),

    link: function (scope, element) {

      scope.open = true;
      scope.uniques = [];
      scope.loading = false;
      scope.limit = 25;
      scope.operator = DEFAULT_OPERATOR;

      scope.$watch('search', function(search){
        if (search && search._id.length) scope.open = true;
      }, true)

      /*
       *  This function is called when the user clicks a checkbox.
       *
       *  In both "and" & "or" mode,
       *  - a CHECKED box is "selected" and "!negative"
       *  - an UNCHECKED box is "!selected" and "!negative"
       * 
       *  In only "and" mode,
       *  - a NEGATIVE box is "selected" and "negative"
       */
      scope.refresh = function(u) {
        if (scope.loading) { // cannot refresh this unique until previous unique has finished
          u.selected = false;
        } else {
          if (!u.selected && !u.negative && scope.operator === "and") { // case where checked becomes negative ("and" mode only)
            u.negative = true;
            u.selected = true;
          }
          else if (!u.selected && u.negative) { // case where negative becomes unselected
            u.negative = false;
          }
          if (!u.count && !u.selected) return; // does not call update() if count is 0, or is not selected
          scope.update();
        }
      }

      var last = false;

      /*
       *  This function is called when a checkbox with a valid count is changed in scope.refresh(), or when the operator switches. The array of 
       *  chosen uniques is updated.
       */
      scope.update = function() {
        var uniques;
        if (scope.operator === "or") { // when switching from "and" mode to "or" mode, all negative selections are unselected
          uniques = scope.uniques.filter(function (d) {
            if (d.negative) {
              d.negative = false; d.selected = false; 
            }
            return d.selected;
          }).map(e => pick(e, ["negative", "_id"]));
        } else { 
          uniques = scope.uniques.filter(function (d) { return d.selected; })
          .map(e => pick(e, ["negative", "_id"]));
        }
        
        last = true;
        if (uniques.length) { // uniques have been chosen, so a query is performed
          scope.query[scope.field] = {
            operator: scope.operator,
            uniques: uniques
          };
        }
        else {
          delete scope.query[scope.field];
        }

        scope.selected = uniques.length;
      }


      /*
       * Watches for query to be interacted with and calls reload().
       */
      scope.$watch('query', function(query){
        reload();
      }, true)

      /*
       *  The facet is reloaded in response to a query.
       */
      function reload(){
        var query = scope.query;
        if (!scope.suggestions || !scope.field) return;
        scope.loading = true;
        $http.post('/api/entries/uniques/', getUniquesRequestBody({ field: scope.field, suggestions: scope.suggestions, query : query }))
        .then(function (res){
          scope.loading = false;
          var uniques = res.data.values;
          if (query.hasOwnProperty(scope.field) && query[scope.field].uniques) {
            let negativeUniques = query[scope.field].uniques.filter(e => e.negative === true);
            for (let e of negativeUniques) {
              if (find(scope.uniques, {_id: e._id})) {
                let unique = find(scope.uniques, {_id: e._id});
                unique.negative = true;
              }
              else {
                scope.uniques.push({id: e._id, negative: true});
              }
            }
          }
          // uniques = [...uniques, ...];
          var map = d3.map(uniques, function(d){ return d._id; });
          // console.log(scope.field, );
          // if (!map.has(scope.field)) {
          //   scope.uniques.unshift({_id: scope.field, count: 0});
          //   map = d3.map(uniques, function(d){ return d._id; });
          // }
          scope.uniques.forEach(function(d){
            d.count = map.has(d._id) ? map.get(d._id).count : 0;
            d.selected = false;
            // Restoration code of current state from query string. Todo: make this work for fields without "uniques" attribute.
            if (query.hasOwnProperty(scope.field) && query[scope.field].uniques) {
              let item = find(query[scope.field].uniques, {"_id": d._id});
              if (item) {
                d.selected = true;
                if (item.negative) {
                  d.negative = true;
                  d.count = 99999; // count is not displayed for negative selections
                }
              }
              scope.operator = query[scope.field].operator || DEFAULT_OPERATOR;
            }
          })
        })
      }

      // all of the uniques - first time
      function load(){
        $http.post('/api/entries/uniques/', getUniquesRequestBody({ field: scope.field, suggestions: scope.suggestions, query : {}, value : "" }))
        .then(function (res){
          scope.uniques = res.data.values;
          reload();
        })

      }

      load();


    }
  };
}];