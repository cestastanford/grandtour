import {find, pick} from "lodash";

const DEFAULT_OPERATOR = "or";

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

      scope.refresh = function(u) {
        if (!u.selected && !u.negative) {
          u.negative = true;
          u.selected = true;
        }
        else if (!u.selected && u.negative) {
          u.negative = false;
        }
        if (!u.count) return;
        scope.update();
      }

      var last = false;

      scope.update = function() {
        var uniques = scope.uniques.filter(function(d){ return d.selected; }).map(e => pick(e, ["negative", "_id"]));
        last = true;
        if (uniques.length) {
          scope.query[scope.field] = {
            operator: scope.operator,
            uniques: uniques
          };
        }
        else {
          delete scope.query[scope.field];
        }
        scope.selected = scope.uniques.filter(function(d){ return d.selected; }).length;
        //scope.search = "";
      }

      scope.$watch('query', function(query){
        reload();
      }, true)

      function reload(){
        var query = scope.query;
        if (!scope.suggestions || !scope.field) return;
        scope.loading = true;
        $http.post('/api/entries/uniques/', {  field : scope.suggestions, query : query })
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
                  d.count = 99999;
                }
              }
              scope.operator = query[scope.field].operator || DEFAULT_OPERATOR;
            }
          })
        })
      }

      // all of the uniques - first time
      function load(){
        $http.post('/api/entries/uniques/', {  field : scope.suggestions, query : {}, value : "" })
        .then(function (res){
          scope.uniques = res.data.values;
          reload();
        })

      }

      load();


    }
  };
}];