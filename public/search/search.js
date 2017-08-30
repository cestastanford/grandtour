/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams, entryHighlightingService, $timeout) {

  $scope.query = {};
  $scope.untouched = true;

  if ($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search2', {
        query: $scope.query
      }
    )
    .success(function(res){

      if (res.error) console.error(res.error);

      entryHighlightingService.saveQuery(res.request)
      $scope.searching = false;
      $scope.entries = res.entries;
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;

    });
  }

  $scope.search = function() {
    $location.path('search/' + getQueryAsString());
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


  /*
  * Trims strings and removes empty strings from query.
  */

  function getQueryAsString() {

    var query = $scope.query

    for (var key in query) {
      if (typeof query[key] === 'string') {
        query[key] = query[key].trim()
        if (!query[key]) delete query[key]
      }
    }

    return JSON.stringify(query)
  
  }

  $scope.clear = function(){
    $scope.query = {};
    $scope.entries = [];
  }

  $('.tooltip').remove();

  $scope.removeFromQuery = function(k) {
    delete $scope.query[k];
  }

  //  export function copied from explore.js
  $scope.export = function() {

    var $btn = $('#export-button').button('loading');

    $http.post('/api/entries/export/', { query: $scope.query } )
    .success(function(res) {

      var entries = d3.tsv.format(res.result.entries);
      var activities = d3.tsv.format(res.result.activities);
      var travels = d3.tsv.format(res.result.travels);

      var zip = new JSZip();
      zip.file("Entries.tsv", entries);
      zip.file("Activities.tsv", activities);
      zip.file("Travels.tsv", travels);
      var content = zip.generate({ type: "blob" });
      saveAs(content, "Grand Tour Explorer - Export.zip");
      $btn.button('reset');

    });
  }

  //  download counts
  $http.get('/api/getcount')
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else $scope.counts = res.data.counts;
  });

});
