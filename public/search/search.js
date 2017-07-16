/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams, entryHighlightingService) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  $scope.freeSearchSections = { biography: true, tours: true, narrative: true, notes: true };
  $scope.freeSearchBeginnings = true;

  // setup for travel date range search
  $scope.resetTravelDate = function(type) {
    travelDate = { queryType: type, query: {} };
    travelModel.date = travelDate;
  };
  var travelModel = { date: {}, place: '' };
  $scope.travelModel = travelModel;
  $scope.resetTravelDate('exact', false);

  if($stateParams.query) {
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

      setupFreeSearch();
      setupTravelSearch();

    });
  } else {

    setupFreeSearch();
    setupTravelSearch();

  }

  //  support for free search by section
  function setupFreeSearch() {

    if ($scope.query.entry) $scope.freeSearchModel = $scope.query.entry
    else $scope.freeSearchModel = { terms: [ { value: '' } ], sections: [
      { key: 'biography', name: 'Biography', checked: true },
      { key: 'narrative', name: 'Narrative', checked: true },
      { key: 'tours', name: 'Tours', checked: true },
      { key: 'notes', name: 'Notes', checked: true }
    ], beginnings: true }
    
    $scope.$watch('freeSearchModel', function(freeSearchModel) { 

      var terms = $scope.freeSearchModel.terms.filter(function(term) { return term.value })
      if (terms.length) {

        $scope.query.entry = {
          terms: terms,
          sections: $scope.freeSearchModel.sections,
          beginnings: $scope.freeSearchModel.beginnings,
        }

      } else delete $scope.query.entry

    }, true)

  }


  //  Updates the travel model in response to $watch or manual trigger
  function updateTravelModel(travelModel) {
    if (travelModel.date.queryType === 'exact') {
      travelModel.date.query.endYear = travelModel.date.query.startYear;
      travelModel.date.query.endMonth = travelModel.date.query.startMonth;
      travelModel.date.query.endDay = travelModel.date.query.startDay;
    }
    for (key in travelModel.date.query) if (!travelModel.date.query[key]) delete travelModel.date.query[key];
    if (Object.getOwnPropertyNames(travelModel.date.query).length > 0) {
      $scope.query.travel = $scope.query.travel || { date: {} };
      $scope.query.travel.date = travelModel.date.query;
    } else if ($scope.query.travel) delete $scope.query.travel.date;
    if (travelModel.place) {
      $scope.query.travel = $scope.query.travel || {};
      $scope.query.travel.place = travelModel.place;
    } else if ($scope.query.travel) delete $scope.query.travel.place;
    if ($scope.query.travel && !$scope.query.travel.place && !$scope.query.travel.date) delete $scope.query.travel;
  }

  //  support for travel date range search
  function setupTravelSearch() {

    if ($scope.query.travel) {
      if ($scope.query.travel.date) {
        if ($scope.query.travel.date.startYear !== $scope.query.travel.date.endYear ||
            $scope.query.travel.date.startMonth !== $scope.query.travel.date.endMonth ||
            $scope.query.travel.date.startDay !== $scope.query.travel.date.endDay) {
          travelModel.date.queryType = 'range';
        }
        travelModel.date.query = $scope.query.travel.date;
      }
      if ($scope.query.travel.place) {
        travelModel.place = $scope.query.travel.place;
      }

    }

    $scope.$watch('travelModel', updateTravelModel, true);

  };

  $scope.search = function(){
    updateTravelModel($scope.travelModel);
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
  $scope.$watch('query', function(query) {
    $scope.pills = [];

    for (key in query) {
      if (query.hasOwnProperty(key)) {

        var pill = {};
        switch (key) {

          case 'entry':
            pill.dimension = 'free search in ' + $scope.query.entry.sections.map(function(section) { return section.name }).join(', ')
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

              if ($scope.travelModel.date.queryType === 'range') {
                pill.dimension += ' range';
                if (query.travel.date.startYear) pill.value += 'from '
              }

              if (query.travel.date.startYear) pill.value += query.travel.date.startYear;
              if (query.travel.date.startMonth) pill.value += '/' + query.travel.date.startMonth;
              if (query.travel.date.startDay)  pill.value += '/' + query.travel.date.startDay;

              if ($scope.travelModel.date.queryType === 'range') {
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

});
