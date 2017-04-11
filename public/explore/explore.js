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

.controller('ExploreCtrl', function($scope, $http, $location, $stateParams, $state, $q, httpQuery, listService, entryHighlightingService) {

  $scope.query = {};
  $scope.untouched = true;

  // setup for free search by section
  var freeSearchModel = {};
  function initFreeSearchModel() {
    freeSearchModel = {};
    freeSearchModel.sections = { biography: true, tours: true, narrative: true, notes: true };
    freeSearchModel.beginnings = true;
    $scope.freeSearchModel = freeSearchModel;
  };
  initFreeSearchModel();

  // setup for travel date range search
  $scope.resetTravelModel = function(type, estimated) {
    travelModel.date = { queryType: type, query: {}, estimated: estimated };
    travelModel.place = '';
  };
  var travelModel = {};
  $scope.travelModel = travelModel;
  $scope.resetTravelModel('exact');

  $scope.dimensions = [
    { type : 'facet', active : false, label : 'Fullname', field : 'fullName', suggestions : 'fullName', sorting : 'fullName' },
    { type : 'number', active : false, label : 'Birth date', field : 'birthDate', sorting : 'dates[0].birthDate' },
    { type : 'facet', active : false, label : 'Birth place', field : 'birthPlace', suggestions : 'places.birthPlace', sorting : 'places[0].birthPlace' },
    { type : 'number', active : false, label : 'Death date', field : 'deathDate', sorting : 'dates[0].deathDate' },
    { type : 'facet', active : false, label : 'Death place', field : 'deathPlace', suggestions : 'places.deathPlace', sorting : 'places[0].deathPlace' },
    { type : 'facet', active : false, label : 'Entry type', field : 'type', suggestions : 'type' },
    { type : 'facet', active : true, label : 'Employments and Identifiers', field : 'pursuits', suggestions : 'pursuits.pursuit' },
    { type : 'facet', active : false, label : 'Occupations & Posts', field : 'occupations', suggestions : 'occupations.title' },
    { type : 'facet', active : true, label : 'Occupations & Posts', subgroup: 'Group', field : 'occupations_group', suggestions : 'occupations.group' },
    { type : 'facet', active : true, label : 'Societies & Academies', field : 'societies', suggestions : 'societies.title' },
    { type : 'facet', active : false, label : 'Societies & Academies', subgroup: 'Role', field : 'societies_role', suggestions : 'societies.role' },
    { type : 'facet', active : true, label : 'Education', subgroup: 'Institution', field : 'education_institution', suggestions : 'education.institution' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Place', field : 'education_place', suggestions : 'education.place' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Teacher', field : 'education_teacher', suggestions : 'education.teacher' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Degree', field : 'education_degree', suggestions : 'education.fullDegree' },
    { type : 'facet', active : false, label : 'Military careers', field : 'military', suggestions : 'military.rank' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Institution', field : 'exhibitions', suggestions : 'exhibitions.title' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Award type', field : 'exhibitions_activity', suggestions : 'exhibitions.activity' },
    { type : 'travel', active : false, label : 'Travel', subgroup : 'Place & Date', field : 'travel' },
    { type : 'freesearch', active : false, label : 'Free search', field : 'entry' },
  ]

  $scope.activeDimensions = [];

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    for (queryField in $scope.query) {
      var dimension = $scope.dimensions.filter(function(d) { return d.field === queryField; })[0];
      dimension.active = true;
    };

    //  setup for free search by section
    if ($scope.query.entry) {
      for (var k in freeSearchModel.sections) {
        if ($scope.query.entry[k]) $scope.freeSearchModel.query = $scope.query.entry[k];
        else $scope.freeSearchModel.sections[k] = false;
      }
    }

    //  setup for travel date range search
    if ($scope.query.travel) {
      if ($scope.query.travel.date) {
        if ($scope.query.travel.date.startYear !== $scope.query.travel.date.endYear ||
            $scope.query.travel.date.startMonth !== $scope.query.travel.date.endMonth ||
            $scope.query.travel.date.startDay !== $scope.query.travel.date.endDay) {
          travelModel.date.queryType = 'range';
        }
        travelModel.date.estimated = ($scope.query.travel.date.estimated === 'yes');
        travelModel.date.query = $scope.query.travel.date;
        delete travelModel.date.query.estimated;
      }
      if ($scope.query.travel.place) {
        travelModel.place = $scope.query.travel.place;
      }
    }
  }

  //  support for free search by section
  $scope.$watch('freeSearchModel.query', function(query) {
    for (var section in freeSearchModel.sections) {
      if (freeSearchModel.sections[section] && query) {
        if (!$scope.query.entry) $scope.query.entry = { sections: {} };
        $scope.query.entry.sections[section] = query;
      } else if ($scope.query.entry) delete $scope.query.entry.sections[section];
    }
    if ($scope.query.entry) $scope.query.entry.beginnings = freeSearchModel.beginnings ? 'yes' : 'no';
    queryUpdated($scope.query);
  });

  $scope.$watchCollection('freeSearchModel.sections', function(sections) {
    for (var section in sections) {
      if (sections[section] && freeSearchModel.query) {
        if (!$scope.query.entry) $scope.query.entry = { sections: {} };
        $scope.query.entry.sections[section] = freeSearchModel.query;
      }
      else if ($scope.query.entry) {
        delete $scope.query.entry.sections[section];
        if (Object.keys($scope.query.entry.sections).length === 0) delete $scope.query.entry;
      }
    }
    if ($scope.query.entry) $scope.query.entry.beginnings = freeSearchModel.beginnings ? 'yes' : 'no';
    queryUpdated($scope.query);
  });

  $scope.$watch('freeSearchModel.beginnings', function(beginnings) {
    if ($scope.query.entry) $scope.query.entry.beginnings = beginnings ? 'yes' : 'no';
  });

  //  support for travel date range search
  $scope.$watch('travelModel', function(travelModel) {
    if (travelModel.date.queryType === 'exact') {
      travelModel.date.query.endYear = travelModel.date.query.startYear;
      travelModel.date.query.endMonth = travelModel.date.query.startMonth;
      travelModel.date.query.endDay = travelModel.date.query.startDay;
    }
    for (key in travelModel.date.query) if (!travelModel.date.query[key]) delete travelModel.date.query[key];
    if (Object.getOwnPropertyNames(travelModel.date.query).length > 0) {
      $scope.query.travel = $scope.query.travel || { date: {} };
      $scope.query.travel.date = travelModel.date.query;
      $scope.query.travel.date.estimated = travelModel.date.estimated ? 'yes' : 'no';
    } else if ($scope.query.travel) delete $scope.query.travel.date;
    if (travelModel.place) {
      $scope.query.travel = $scope.query.travel || {};
      $scope.query.travel.place = travelModel.place;
    } else if ($scope.query.travel) delete $scope.query.travel.place;
    if ($scope.query.travel && !$scope.query.travel.place && !$scope.query.travel.date) delete $scope.query.travel;
  }, true);


  $scope.$watch('dimensions',function(dimensions){
    $scope.activeDimensions = $scope.dimensions.filter(function(d){ return d.active; })
    for (var i = 0; i < dimensions.length; i++) {
      if (!dimensions[i].active) {
        $scope.removeFromQuery(dimensions[i].field);
        if (dimensions[i].field === 'entry') initFreeSearchModel();
        if (dimensions[i].field === 'travel') $scope.resetTravelModel('exact');
      }
    }
  },true)

  $scope.search = function(){
    $location.path('search/' + JSON.stringify(clean($scope.query)) );
  }

  var someQuery = httpQuery('/api/entries/search');

  var runQuery = function (query) {
    var httpPromise = someQuery(query);
    $scope.searching = true;
    httpPromise.then(function (data) {
      entryHighlightingService.saveQuery(data.request);
      $scope.searching = false;
      $scope.entries = data.entries;
      calculateFirstTravelOrders(data.entries);
      if (data.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
      $('[data-toggle="tooltip"]').tooltip()
    });
  };

  function queryUpdated(query){
    for (var k in query){
      if (!/\S/.test(query[k])) delete query[k]
    }
    $scope.untouched = Object.getOwnPropertyNames(query).length == 0;
    $('[data-toggle="tooltip"]').tooltip();
    if (!Object.getOwnPropertyNames(query).length) $scope.clear();

    $state.go('explore', { query: JSON.stringify(clean(query)) }, { notify: false, reload: false });
    runQuery(query);

  }

  $scope.$watch('query', queryUpdated, true);

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
    if (k === 'entry') initFreeSearchModel();
    if (k === 'travel') $scope.resetTravelModel('exact');
  }

  $('.tooltip').remove();
  $('[data-toggle="tooltip"]').tooltip()

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
            if ($scope.query.entry.beginnings === 'yes') pill.dimension += ' (word beginnings only)'
            pill.value = $scope.query.entry.sections[Object.keys($scope.query.entry.sections)[0]];
            break;

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
                if (query.travel.date.startYear) pill.value += 'from ';
              }

              if (query.travel.date.startYear) pill.value += query.travel.date.startYear;
              if (query.travel.date.startMonth) pill.value += '/' + query.travel.date.startMonth;
              if (query.travel.date.startDay)  pill.value += '/' + query.travel.date.startDay;

              if ($scope.travelModel.date.queryType === 'range') {
                if (query.travel.date.endYear) pill.value += ' until ' + query.travel.date.endYear;
                if (query.travel.date.endMonth) pill.value += '/' + query.travel.date.endMonth;
                if (query.travel.date.endDay) pill.value += '/' + query.travel.date.endDay;
              }

              if (query.travel.date.estimated === 'yes') pill.value += ' (including estimated dates)';

            }

            break;

          default:
            pill.dimension = key.split('_').join(' ');
            pill.value = query[key];

        }

        pill.key = key;
        $scope.pills.push(pill);

      }
    }

  }, true);

})
