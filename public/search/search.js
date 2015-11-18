/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  $scope.freeSearchSections = { biography: true, tours: true, narrative: true, notes: true };

  // setup for travel date range search
  $scope.travelDateQueryType = 'exact';
  $scope.travelDateQuery = {};

  $scope.setTravelDateQueryType = function(type) {
    $scope.travelDateQueryType = type;
    $scope.travelDateQuery = {};
    delete $scope.query.travel_date;
  }

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

    //  setup for free search by section
    if ($scope.query.entry) {
      for (var k in $scope.freeSearchSections) {
        if ($scope.query.entry[k]) $scope.freeSearchQuery = $scope.query.entry[k];
        else $scope.freeSearchSections[k] = false;
      }
    }

    //  setup for travel date range search
    if ($scope.query.travel_date) {
      if ($scope.query.travel_date.at) {
        $scope.travelDateQuery.atYear = $scope.query.travel_date.at.year;
      } else {
        $scope.travelDateQueryType = 'range';
        if ($scope.query.travel_date.start) $scope.travelDateQuery.start = $scope.query.travel_date.start;
        if ($scope.query.travel_date.end) $scope.travelDateQuery.end = $scope.query.travel_date.end;
      }
    }
  }

  //  support for free search by section
  $scope.$watch('freeSearchQuery', function(newValue) {
    for (var section in $scope.freeSearchSections) {
      if ($scope.freeSearchSections[section] && $scope.freeSearchQuery) {
        if (!$scope.query.entry) $scope.query.entry = {};
        $scope.query.entry[section] = $scope.freeSearchQuery;
      }
    }
  });

  $scope.$watchCollection('freeSearchSections', function(newValues) {
    for (var section in $scope.freeSearchSections) {
      if ($scope.freeSearchSections[section] && $scope.freeSearchQuery) {
        if (!$scope.query.entry) $scope.query.entry = {};
        $scope.query.entry[section] = $scope.freeSearchQuery;
      }
      else if ($scope.query.entry) {
        delete $scope.query.entry[section];
        if (Object.keys($scope.query.entry).length === 0) delete $scope.query.entry;
      }
    }
  });

  //  support for travel date range search
  $scope.$watch('travelDateQuery', function(tQ) {
    if (tQ.atYear) $scope.query.travel_date = { at: { year : tQ.atYear } };
    else if (tQ.start || tQ.end) {
      $scope.query.travel_date = {};
      if (tQ.start) $scope.query.travel_date.start = tQ.start;
      if (tQ.end) $scope.query.travel_date.end = tQ.end;
    }
    else delete $scope.query.travel_date;
  }, true)

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
