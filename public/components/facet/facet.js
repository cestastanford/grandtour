/*
 *  facet.js provides the functionality for the facet feature. Tools to explore filters are implemented here, including checkboxes, search
 *  operators, and sorting of a filter's options. Works with facet.pug.
 */

import {find, pick} from "lodash";

const DEFAULT_OPERATOR = "and";

/* Parses uniques, mainly, dealing with negatives.
 * Returns a new uniques array that can be used
 * as the value to $scope.uniques in this facet.
 */
function parseUniques({ uniques, query, field }) {
  let newUniques = uniques;
  if (query.hasOwnProperty(field) && query[field].uniques) {
    let negativeUniques = query[field].uniques.filter(e => e.negative === true);
    for (let e of negativeUniques) {
      if (find(newUniques, {_id: e._id})) {
        let unique = find(newUniques, {_id: e._id});
        unique.negative = true;
      }
      else {
        newUniques.push({_id: e._id, negative: true});
      }
    }
  }
  const map = d3.map(uniques, function(d){ return d._id; });
  return newUniques.map(function(d) {
    const restoreStateFromQs = () => {
      // Restoration code of current state from query string.
      // TODO: make this work for fields without "uniques" attribute.
      let result = {};
      if (query.hasOwnProperty(field) && query[field].uniques) {
        let item = find(query[field].uniques, {"_id": d._id});
        if (item) {
          result.selected = true;
          if (item.negative) {
            result.negative = true;
            result.count = 99999; // count is not displayed for negative selections
          }
        }
      }
      return result;
    };
    return {
      ...d,
      count: map.has(d._id) ? map.get(d._id).count : 0,
      selected: false,
      ...restoreStateFromQs()
    }
  });
}

export default ['$http', function($http) {
  return {
    scope : {
      label : '@',
      subgroup : '@',
      query : '=',
      rawuniques: '=',
      field : '@',
      suggestion : '@'
    },

    template: require('pug-loader!./facet.pug'),

    link: function (scope, element) {
      scope.open = true;
      scope.newUniques = [];
      scope.loading = false;
      scope.limit = 25;
      scope.operator = DEFAULT_OPERATOR;

      scope.$watch('search', function(search){
        if (search && search._id.length) {
          scope.open = true;
        }
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

      scope.$watch('rawuniques', rawuniques => {
        scope.uniques = parseUniques({
          uniques: rawuniques || [],
          query: scope.query,
          field: scope.field,
        });
        if (scope.query && scope.query[scope.field] && scope.query[scope.field].operator) {
          scope.operator = scope.query[scope.field].operator;
        }
        else {
          scope.operator = DEFAULT_OPERATOR;
        }
      }, true);


    }
  };
}];