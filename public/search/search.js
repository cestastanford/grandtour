/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('SearchCtrl', function($scope, $http, $location, $stateParams, listService) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  $scope.freeSearchSections = { biography: true, tours: true, narrative: true, notes: true };
  $scope.freeSearchBeginnings = true;

  // setup for travel date range search
  $scope.resetTravelDateModel = function(type, estimated) {
    travelDateModel = { queryType: type, query: {}, estimated: estimated };
    $scope.travelDateModel = travelDateModel;
    delete $scope.query.travel_date;
  };
  var travelDateModel;
  $scope.resetTravelDateModel('exact', false);

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    $scope.searching = true;
    $http.post('/api/entries/search2', {
        query: $scope.query
      }
    )
    .success(function(res){

      if (res.error) console.error(res.error);

      $scope.searching = false;
      $scope.entries = res.entries;
      calculateFirstTravelOrders(res.entries);
      if (res.entries.length) $scope.noResults = false;
      else $scope.noResults = true;

      setupFreeSearch();
      setupTravelDateSearch();

    });
  } else {

    setupFreeSearch();
    setupTravelDateSearch();

  }

  //  support for free search by section
  function setupFreeSearch() {

    if ($scope.query.entry) {
      for (var k in $scope.freeSearchSections) {
        if ($scope.query.entry.sections[k]) $scope.freeSearchQuery = $scope.query.entry.sections[k];
        else $scope.freeSearchSections[k] = false;
      }
      if ($scope.query.entry.beginnings === 'no') $scope.freeSearchBeginnings = false;
    }

    //  support for free search by section
    $scope.$watch('freeSearchQuery', function(freeSearchQuery) {
      for (var section in $scope.freeSearchSections) {
        if ($scope.freeSearchSections[section] && freeSearchQuery) {
          if (!$scope.query.entry) $scope.query.entry = { sections: {} };
          $scope.query.entry.sections[section] = freeSearchQuery;
        }
      }
      if ($scope.query.entry) $scope.query.entry.beginnings = $scope.freeSearchBeginnings ? 'yes' : 'no';
    });

    $scope.$watchCollection('freeSearchSections', function(freeSearchSections) {
      for (var section in freeSearchSections) {
        if (freeSearchSections[section] && $scope.freeSearchQuery) {
          if (!$scope.query.entry) $scope.query.entry = { sections: {} };
          $scope.query.entry.sections[section] = $scope.freeSearchQuery;
        }
        else if ($scope.query.entry) {
          delete $scope.query.entry.sections[section];
          if (Object.keys($scope.query.entry.sections).length === 0) delete $scope.query.entry;
        }
      }
      if ($scope.query.entry) $scope.query.entry.beginnings = $scope.freeSearchBeginnings ? 'yes' : 'no';
    });

    $scope.$watch('freeSearchBeginnings', function(freeSearchBeginnings) {
      if ($scope.query.entry) $scope.query.entry.beginnings = freeSearchBeginnings ? 'yes' : 'no';
    });

  }

  //  support for travel date range search
  function setupTravelDateSearch() {

    if ($scope.query.travel_date) {
      if ($scope.query.travel_date.startYear !== $scope.query.travel_date.endYear ||
          $scope.query.travel_date.startMonth !== $scope.query.travel_date.endMonth ||
          $scope.query.travel_date.startDay !== $scope.query.travel_date.endDay) {
        travelDateModel.queryType = 'range';
      }
      travelDateModel.estimated = ($scope.query.travel_date.estimated === 'yes');
      travelDateModel.query = $scope.query.travel_date;
      delete travelDateModel.query.estimated;
    }

    $scope.$watch('travelDateModel', function(travelDateModel) {
      if (travelDateModel.queryType === 'exact') {
        travelDateModel.query.endYear = travelDateModel.query.startYear;
        travelDateModel.query.endMonth = travelDateModel.query.startMonth;
        travelDateModel.query.endDay = travelDateModel.query.startDay;
      }
      for (key in travelDateModel.query) if (!travelDateModel.query[key]) delete travelDateModel.query[key];
      if (Object.getOwnPropertyNames(travelDateModel.query).length > 0) {
        $scope.query.travel_date = travelDateModel.query;
        $scope.query.travel_date.estimated = travelDateModel.estimated ? 'yes' : 'no';
      } else delete $scope.query.travel_date;
    }, true);

  };

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

  //  initialize view model
  var viewModel = {
      newListName: ''
  };

  //  expose view model to scope
  $scope.viewModel = viewModel;

  //  expose shared list model to scope
  $scope.sharedListModel = listService.sharedListModel

  //  selection/delection commands
  $scope.selectAllEntries = function() {
    for (var i = 0; i < $scope.entries.length; i++) {
      $scope.entries[i].selected = true;
    }
  };

  $scope.deselectAllEntries = function() {
    for (var i = 0; i < $scope.entries.length; i++) {
      $scope.entries[i].selected = false;
    }
  };

  $scope.addSelectedEntriesToList = function(list) {
    for(var i = 0; i < $scope.entries.length; i++) {
      var entry = $scope.entries[i];
      if (entry.selected) {
        entry.addedToList = entry.alreadyInList = false;
        listService.addToList(list, entry, (function(result) {
          if (result.addedToList) {
            this.entry.addedToList = true;
          } else if (result.alreadyInList) {
            this.entry.alreadyInList = true;
          }
        }).bind({ entry: entry }));
      }
    }
  };

  $scope.addSelectedEntriesToNewList = function() {
    listService.newList(viewModel.newListName, function(list) {
      viewModel.newListName = '';
      console.log('list created: ' + list.name);
      $scope.addSelectedEntriesToList(list);
    });
  };

  //  support for sorting entries
  var sortModel = {
    activeSortableDimensions: [
      { label : 'Fullname', sorting : 'fullName' },
      { label : 'Birth date', sorting : 'dates[0].birthDate' },
      { label : 'Birth place', sorting : 'places[0].birthPlace' },
      { label : 'Date of first travel', sorting : 'firstTravelUTC' },
    ],
    dimension: 'index',
    reverseSorting: false
  };

  $scope.sortModel = sortModel;

  function calculateFirstTravelOrders(entries) {
    for (var i = 0; i < entries.length; i++) {

      var entry = entries[i];
      if (entry.travels) {

        for (var j = 0; j < entry.travels.length; j++) {

          var travel = entry.travels[j];
          if (travel.travelStartYear) {

            entry.firstTravelUTC = Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay);
            break;

          }
        }
      }
    }
  }

  //  export function copied from explore.js
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
            pill.dimension = 'free search in ' + Object.keys($scope.query.entry.sections).join(', ');
            pill.value = $scope.query.entry.sections[Object.keys($scope.query.entry.sections)[0]];
            break;

          case 'travel_date':
            pill.dimension = 'travel date';

            pill.value = query.travel_date.startYear;
            if (query.travel_date.startMonth) {
              
              pill.value += '/' + query.travel_date.startMonth;
              if (query.travel_date.startDay) {

                pill.value += '/' + query.travel_date.startDay;
              }
            }
            
            if ($scope.travelDateModel.queryType === 'range') {

              pill.dimension += ' range';
              pill.value = 'from ' + pill.value + ' to ' + query.travel_date.endYear;
              if (query.travel_date.endMonth) {
                
                pill.value += '/' + query.travel_date.endMonth;
                if (query.travel_date.endDay) {

                  pill.value += '/' + query.travel_date.endDay;
                }
              }
            }

            if (query.travel_date.estimated === 'yes') {
              pill.value += ' (including estimated dates)'
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
