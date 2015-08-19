/**********************************************************************
 * Entries controller
 **********************************************************************/
app

.factory('httpQuery', function ($http, $q) {
  return function (url) {
    var cancelQuery = null;
    return function runQuery(query) {
      // if we were running a query before,
      // cancel it so it doesn't invoke its success callback
      if (cancelQuery) {
        cancelQuery.resolve();
      }
      cancelQuery = $q.defer();
      return $http.
        post(url, { query: query }, { timeout: cancelQuery.promise })
        .then(function (response) {
          cancelQuery = null;
          return response.data;
        });
    };
  };
})

.controller('ExploreCtrl', function($scope, $http, $location, $stateParams, $q, httpQuery) {

  $scope.query = {};
  $scope.untouched = true;

  $scope.dimensions = [
    { active : false, label : 'Fullname', field : 'fullName', suggestions : 'fullName' },
    { active : true, label : 'Pursuits & Situations', field : 'pursuits', suggestions : 'pursuits.pursuit' },
    { active : false, label : 'Occupations & Posts', field : 'occupations', suggestions : 'occupations.title' },
    { active : true, label : 'Occupations & Posts (group)', field : 'occupations_group', suggestions : 'occupations.group' },
    { active : true, label : 'Societies & Academies', field : 'societies', suggestions : 'societies.title' },
    { active : false, label : 'Societies & Academies (role)', field : 'societies_role', suggestions : 'societies.role' },
    { active : true, label : 'Education (institution)', field : 'education_institution', suggestions : 'education.institution' },
    { active : false, label : 'Education (place)', field : 'education_place', suggestions : 'education.place' },
    { active : false, label : 'Education (teacher)', field : 'education_tacher', suggestions : 'education.teacher' },
    { active : false, label : 'Education (degree)', field : 'education_degree', suggestions : 'education.fullDegree' },
    { active : false, label : 'Military careers', field : 'military', suggestions : 'military.rank' },
    { active : false, label : 'Exhibitions & Awards', field : 'exhibitions', suggestions : 'exhibitions.title' },
    { active : false, label : 'Exhibitions & Awards (award)', field : 'exhibitions_activity', suggestions : 'exhibitions.activity' },
    { active : false, label : 'Travel', field : 'travel_place', suggestions : 'travels.place' },
  ]

  $scope.activeDimensions = [];

  $scope.$watch('dimensions',function(dimensions){
    $scope.activeDimensions = $scope.dimensions.filter(function(d){ return d.active; })
  },true)

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search', {
        query: $scope.query
      }
    )
    .success(function(res){
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
      $('[data-toggle="tooltip"]').tooltip()
    });
  }

  $scope.search = function(){
    $location.path('search/' + JSON.stringify(clean($scope.query)) );
  }

  var someQuery = httpQuery('/api/entries/search');

  var runQuery = function (query) {
    var httpPromise = someQuery(query);
    $scope.searching = true;
    httpPromise.then(function (data) {
      $scope.searching = false;
      $scope.entries = data.entries;
      if (data.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
      $('[data-toggle="tooltip"]').tooltip()
    });
  };


  $scope.$watch('query', function(query){
    for (var k in query){
      if (!/\S/.test(query[k])) delete query[k]
    }
    $scope.untouched = Object.getOwnPropertyNames(query).length == 0;
    $('[data-toggle="tooltip"]').tooltip();
    if (!Object.getOwnPropertyNames(query).length) $scope.clear();

    runQuery(query);

  }, true)

  $scope.getSuggestions = function(field, value){
    return $http.post('/api/entries/suggest/', {  field : field, value : value })
    .then(function (res){
      return res.data.results;//.map(function(d){ return { value: d } });
    })
  }

  $scope.export = function(field, value){

    var $btn = $('#export-button').button('loading')

    $http.post('/api/entries/export/', {  query: $scope.query } )
      .success(function (res){

        var entries = d3.tsv.format(res.result.entries);
        var activities = d3.tsv.format(res.result.activities);
        var travels = d3.tsv.format(res.result.travels);

        var zip = new JSZip();
        zip.file("Entries.tsv", entries);
        zip.file("Activities.tsv", activities);
        zip.file("Travels.tsv", travels);
        var content = zip.generate({type:"blob"});
        saveAs(content, "Grand Tour Explorer - Export.zip");
        $btn.button('reset')

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

  $scope.removeFromQuery = function(k){
    delete $scope.query[k];
  }

  $('.tooltip').remove();
  $('[data-toggle="tooltip"]').tooltip()


})
