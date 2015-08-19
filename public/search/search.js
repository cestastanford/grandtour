/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams) {

  $scope.query = {};
  $scope.untouched = true;

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search2', {
        query: $scope.query
      }
    )
    .success(function(res){
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
    });

  }

  $scope.search = function(){
    $location.path('search/' + JSON.stringify(clean($scope.query)) );
  }

  $scope.$watch('query', function(query){
    for (var k in query){
      if (!/\S/.test(query[k])) delete query[k]
    }
    $scope.untouched = Object.getOwnPropertyNames(query).length == 0;
  }, true)



  $scope.getSuggestions = function(field, value){
    return $http.post('/api/entries/suggest/', {  field : field, value : value })
    .then(function (res){
      return res.data.results;//.map(function(d){ return { value: d } });
    })
  }

  function clean(obj){

    for (var key in obj) {
      if (!last(obj[key])) delete obj[key];
    }

    function last(o){
      for (var k in o) {
        if (typeof o[k] == 'object') return last(o[k]);
        else return /\S/.test(o.value) ? o[k] : null;
      }
    }

    return obj;
  }

  $scope.clear = function(){
    $scope.query = {};
    $scope.entries = [];
  }

  $('.tooltip').remove();

});
