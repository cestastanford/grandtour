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

.filter('isArray', function() {
  return function (input) {
    return angular.isArray(input);
  };
})

.controller('ExploreCtrl', function($scope, $http, $location, $stateParams, $state, $q, httpQuery) {

  $scope.query = {};
  $scope.untouched = true;

  $scope.dimensions = [
    { type : 'facet', active : false, label : 'Fullname', field : 'fullName', suggestions : 'fullName' },
    { type : 'number', active : false, label : 'Birth date', field : 'birthDate' },
    { type : 'facet', active : false, label : 'Birth place', field : 'birthPlace', suggestions : 'places.birthPlace' },
    { type : 'number', active : false, label : 'Death date', field : 'deathDate' },
    { type : 'facet', active : false, label : 'Death place', field : 'deathPlace', suggestions : 'places.deathPlace' },
    { type : 'facet', active : true, label : 'Pursuits & Situations', field : 'pursuits', suggestions : 'pursuits.pursuit' },
    { type : 'facet', active : false, label : 'Occupations & Posts', field : 'occupations', suggestions : 'occupations.title' },
    { type : 'facet', active : true, label : 'Occupations & Posts', subgroup: 'Group', field : 'occupations_group', suggestions : 'occupations.group' },
    { type : 'facet', active : true, label : 'Societies & Academies', field : 'societies', suggestions : 'societies.title' },
    { type : 'facet', active : false, label : 'Societies & Academies', subgroup: 'Role', field : 'societies_role', suggestions : 'societies.role' },
    { type : 'facet', active : true, label : 'Education', subgroup: 'Institution', field : 'education_institution', suggestions : 'education.institution' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Place', field : 'education_place', suggestions : 'education.place' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Teacher', field : 'education_tacher', suggestions : 'education.teacher' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Degree', field : 'education_degree', suggestions : 'education.fullDegree' },
    { type : 'facet', active : false, label : 'Military careers', field : 'military', suggestions : 'military.rank' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Institution', field : 'exhibitions', suggestions : 'exhibitions.title' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Award type', field : 'exhibitions_activity', suggestions : 'exhibitions.activity' },
    { type : 'facet', active : false, label : 'Travel', subgroup: 'Place', field : 'travel_place', suggestions : 'travels.place' },
    { type : 'number', active : false, label : 'Travel', subgroup: 'Year', field : 'travel_at' },
    { type : 'text', active : false, label : 'Free search', field : 'entry' },
  ]

  $scope.activeDimensions = [];

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    console.log('loaded query: ', $scope.query);
    for (queryField in $scope.query) {
      var dimension = $scope.dimensions.filter(function(d) { return d.field === queryField; })[0];
      dimension.active = true;
      console.log(queryField, dimension);
    };
  }

  $scope.$watch('dimensions',function(dimensions){
    $scope.activeDimensions = $scope.dimensions.filter(function(d){ return d.active; })
  },true)

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

    $state.go('explore', { query: JSON.stringify(clean(query)) }, { notify: false, reload: false });

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
