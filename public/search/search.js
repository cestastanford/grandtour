import saveAs from "file-saver";
import JSZip from "jszip";
/**********************************************************************
 * Entries controller
 **********************************************************************/
 export default ['$scope', '$http', '$location', '$stateParams', 'entryHighlightingService', '$timeout', function($scope, $http, $location, $stateParams, entryHighlightingService, $timeout) {

  $scope.query = {};
  $scope.untouched = true;

  if ($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/explorer/api/entries/search2', {
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
    $location.path('search/' + JSON.stringify(clean($scope.query)));
  }

  $scope.$watch('query', function(query){
    for (var k in query){
      if (!/\S/.test(query[k])) delete query[k]
    }
    $scope.untouched = Object.getOwnPropertyNames(query).length == 0;
  }, true)



  $scope.getSuggestions = function(field, value){
    return $http.post('/explorer/api/entries/suggest/', {  field : field, value : value })
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

  $scope.removeFromQuery = function(k) {
    delete $scope.query[k];
  }

  //  export function copied from explore.js
  $scope.export = function() {

    var $btn = $('#export-button').button('loading');

    $http.post('/explorer/api/entries/export/', { query: $scope.query } )
    .success(function(res) {

      var entries = d3.tsv.format(res.result.entries);
      var activities = d3.tsv.format(res.result.activities);
      var travels = d3.tsv.format(res.result.travels);

      var zip = new JSZip();
      zip.file("Travelers.tsv", entries);
      zip.file("Travelers_Life_Events.tsv", activities);
      zip.file("Travelers_Itineraries.tsv", travels);
      zip.file("LICENSE", "Data derived from Ceserani, Giovanna. “The Grand Tour Explorer.” A World Made by Travel: The Digital Grand Tour. Redwood City: Stanford University Press, 2024. http://doi.org/10.21627/2024wmt. Licensed under the Creative Commons License CC BY-NC-ND 4.0.");
      var content = zip.generate({type:"blob"});
      saveAs(content, "Grand Tour Explorer - Export.zip");
      $btn.button('reset')

    });
  }

  //  download counts
  $http.get('/explorer/api/getcount')
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else $scope.counts = res.data.counts;
  });

}];