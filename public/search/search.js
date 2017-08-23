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

  setupPillUpdating();

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


  //  helper functions for displaying complex queries in pills

  function setupPillUpdating() {

    $scope.$watch('query', function(query) {
      
      $scope.pills = [];

      for (key in query) {
        if (query.hasOwnProperty(key)) {

          var pill = {};
          switch (key) {

            case 'entry':
              pill.dimension = 'free search in ' + $scope.query.entry.sections.filter(function(section) { return section.checked })
              .map(function(section) { return section.name }).join(', ')
              
              if ($scope.query.entry.beginnings) pill.dimension += ' (word beginnings only)'
              pill.value = $scope.query.entry.terms.map(function(term) { return term.value }).join(', ')
              break

            case 'travel':
              pill.dimension = 'travel ';
              pill.value = '';

              if (query.travel.place) {

                if (query.travel.date) {
                  pill.dimension += 'place and ';
                  pill.value += (query.travel.place + ', ');
                } else {
                  pill.dimension += 'place';
                  pill.value += query.travel.place;
                }

              }

              if (query.travel.date) {

                pill.dimension += 'date'

                if (query.travel.date.queryType === 'range') {
                  pill.dimension += ' range';
                  if (query.travel.date.startYear) pill.value += 'from '
                }

                if (query.travel.date.startYear) pill.value += query.travel.date.startYear;
                if (query.travel.date.startMonth) pill.value += '/' + query.travel.date.startMonth;
                if (query.travel.date.startDay)  pill.value += '/' + query.travel.date.startDay;

                if (query.travel.date.queryType === 'range') {
                  if (query.travel.date.endYear) pill.value += ' until ' + query.travel.date.endYear;
                  if (query.travel.date.endMonth) pill.value += '/' + query.travel.date.endMonth;
                  if (query.travel.date.endDay) pill.value += '/' + query.travel.date.endDay;
                }

              }

              break;

            default:
              pill.dimension = key.split('_').join(' ');
              pill.value = query[key];

          }
          
          $scope.pills.push(pill);

        }
      
      }

    }, true);

  }

});
