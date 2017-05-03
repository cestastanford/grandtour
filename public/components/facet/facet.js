app.directive('facet', function($http) {
  return {

    scope : {
      label : '@',
      subgroup : '@',
      query : '=',
      field : '@',
      suggestions : '@'
    },

    templateUrl: 'components/facet',

    link: function (scope, element) {

      scope.open = true;
      scope.uniques = [];
      scope.loading = false;
      scope.limit = 25;

      scope.$watch('search', function(search){
        if (search && search._id.length) scope.open = true;
      }, true)

      scope.refresh = function(u){
        if (!u.count) return;
        update();
      }

      var last = false;

      function update(){
        var uniques = scope.uniques.filter(function(d){ return d.selected; }).map(function(d){ return d._id; })
        last = true;
        scope.query[scope.field] = uniques;
        scope.selected = scope.uniques.filter(function(d){ return d.selected; }).length;
        //scope.search = "";
      }

      scope.$watch('query', function(query){
        reload();
      }, true)

      function reload(){
        var query = scope.query;
        if (last && query[scope.field]) {
          last = false;
          return;
        }
        if (!scope.suggestions || !scope.field) return;
        //var model = scope.query[scope.field];
        //if (model == undefined || !model.length) delete query[scope.field];
        //else query[scope.field] = model;

        var c = angular.copy(query);
        delete c[scope.field];
        scope.loading = true;
        $http.post('/api/entries/uniques/', {  field : scope.suggestions, query : c })
        .then(function (res){
          scope.loading = false;
          var uniques = res.data.values;
          var map = d3.map(uniques, function(d){ return d._id; });
          scope.uniques.forEach(function(d){
            d.count = map.has(d._id) ? map.get(d._id).count : 0;
            d.selected = query.hasOwnProperty(scope.field) && query[scope.field].indexOf(d._id) != -1 ? true : false;
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
});
