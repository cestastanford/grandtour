import saveAs from "file-saver";
import JSZip from "jszip";
/**********************************************************************
 * Entries controller
 **********************************************************************/

export default ['$scope', '$http', '$location', '$stateParams', '$state', '$q', 'httpQuery', 'entryHighlightingService', function($scope, $http, $location, $stateParams, $state, $q, httpQuery, entryHighlightingService) {

  $scope.query = {};
  $scope.untouched = true;

  $(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
  });

  $scope.dimensions = [
    { type : 'facet', active : false, label : 'Traveler name', description: 'The names of the 6005 travelers in the database, including alternate names. ', field : 'fullName', suggestion: 'fullName', sorting : 'fullName' },
    { type : 'date', active : false, label : 'Birth date', description: 'The year of birth of travelers in the database, which the Dictionary records for 40.5% of them. ', field : 'birthDate', sorting : 'dates[0].birthDate' },
    { type : 'facet', active : false, label : 'Birth place', description: 'The place of birth—ranging from town to country—of travelers in the database, which the Dictionary records for around 2% of them. ', field : 'birthPlace', suggestion: 'places.birthPlace', sorting : 'places[0].birthPlace' },
    { type : 'date', active : false, label : 'Death date', description: 'The year of death of the travelers in the database, which the Dictionary records for just over 40% of them. ', field : 'deathDate', sorting : 'dates[0].deathDate' },
    { type : 'facet', active : false, label : 'Death place', description: 'The place of birth—ranging from town to country—of travelers in the database. ', field : 'deathPlace', suggestion: 'places.deathPlace', sorting : 'places[0].deathPlace' },
    { type : 'facet', active : false, label : 'Gender', description: 'When known as either female or male, the gender identity of travelers in the database. This is unknown for 1.17% of our travelers. ', field : 'type', suggestion: 'type' },
    { type : 'facet', active : true, label : 'DBITI Employments & Identifiers', description: 'Terms used in the Dictionary to describe travelers’ endeavors, achievements, interests, and defining characteristics. There are just over 200 terms used in reference to about 15% of the travelers in the database. ', field : 'pursuits', suggestion: 'pursuits.pursuit' },
    { type : 'facet', active : false, label : 'Occupations & Posts', description: 'Occupations and posts, ranging from political appointments and honors to trades and crafts, held by travelers. The Dictionary records around 300 positions and professions for about 25% of travelers in the database. ', field : 'occupations', suggestion: 'occupations.title' },
    { type : 'facet', active : true, label : 'Occupations & Posts', subgroup: 'Group', description: 'The ten groupings in which we divided the occupations and posts of the travelers in the database. ', field : 'occupations_group', suggestion: 'occupations.group' },
    { type : 'facet', active : true, label : 'Societies & Academies', description: 'The 26 cultural, scientific and artistic associations to which the Dictionary records affiliations for around 8% of the travelers in the database. ', field : 'societies', suggestion: 'societies.title' },
    { type : 'facet', active : false, label : 'Societies & Academies', subgroup: 'Role', description: 'The role, as recorded by the Dictionary, played by our travelers in the societies or academies to which they were affiliated. ', field : 'societies_role', suggestion: 'societies.role' },
    { type : 'facet', active : true, label : 'Education', subgroup: 'Institution', description: 'The 107 institutions of education, ranging from preparatory schools to universities and academies, as recorded by the Dictionary for just over 18% of the travelers in the database. ', field : 'education_institution', suggestion: 'education.institution' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Place', description: 'The 69 locations, ranging from town to country, where the travelers were educated, as recorded by the Dictionary for just over 19% of the travelers in the database. ', field : 'education_place', suggestion: 'education.place' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Teacher', description: 'The 95 persons recorded by the Dictionary as teachers for 1.73% of the travelers in the database. ', field : 'education_teacher', suggestion: 'education.teacher' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Degree', description: 'The degrees received by travelers, as recorded by the Dictionary. ', field : 'education_degree', suggestion: 'education.fullDegree' },
    { type : 'facet', active : false, label : 'Military careers', description: 'Ranks and posts in military careers as recorded by the Dictionary for just over 4.3% of the travelers in the database. ', field : 'military', suggestion: 'military.rank' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Institution', description: 'The 10 institutions sponsoring art exhibitions or educational fellowships, which the Dictionary records for 2.4% of the travelers in the database. ', field : 'exhibitions', suggestion: 'exhibitions.title' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Award type', description: 'The award gained at art exhibition as recorded by the Dictionary for 0.4% of the travelers in the database. ', field : 'exhibitions_activity', suggestion: 'exhibitions.activity' },

    { type : 'facet', active : false, label : 'Mentioned names', description: 'The names of people mentioned in the Dictionary in other entries. There are 24,041 instances of such mentions for ca. 83% of the travelers in the database. ', field : 'mentionedNames', suggestion: 'mentionedNames.name' },
    { type : 'facet', active : false, label : 'Sources', description: 'The bibliographical or archival references recorded by the Dictionary in associations with 69.2% of the travelers in the database. ', field : 'sources', suggestion: 'sources.abbrev' },
    { type : 'facet', active : false, label : 'Travel place', description: 'The 431 locations which are recorded by the Dictionary as destinations of travel for the travelers in the database. ', field : 'travelPlace', suggestion: 'travels.place' },
    { type : 'date', active : false, label : 'Travel date', description: 'The dates recorded by the Dictionary in association with the place of travels for the travelers in the database. ', field : 'travelDate'},
    { type : 'freesearch', active : false, label : 'Free word search', description: 'Word search in the text of the database’s entries, as these texts appear in the Dictionary, with the options to find all cases that match the beginning or end of the word, in case of spelling changes; or find all cases that do not mention the word. Word search can further be specified for the particular portion of an entry. ', field : 'entry' },
  ]

  $scope.activeDimensions = [];

  if($stateParams.query) {
    $scope.query = JSON.parse($stateParams.query);
    for (let queryField in $scope.query) {
      var dimension = $scope.dimensions.filter(function(d) { return d.field === queryField; })[0];
      dimension.active = true;
    };
  }

  $scope.$watch('dimensions',function(dimensions){
    $scope.activeDimensions = $scope.dimensions.filter(function(d){ return d.active; })
    let queryUpdated = false;
    for (var i = 0; i < dimensions.length; i++) {
      if (!dimensions[i].active && $scope.query.hasOwnProperty(dimensions[i].field)) {
        $scope.removeFromQuery(dimensions[i].field);
        queryUpdated = true;
      }
    }
    if (!queryUpdated) {
      // Update only uniques when query is unchanged.
      runQuery(null);
    }
  }, true)

  $scope.search = function(){
    $location.path('explore/' + JSON.stringify(clean($scope.query)) );
  }

  var someQuery = httpQuery('/api/entries/search');

  var runQuery = async function (query) {
    const activeDimensionsWithSuggestions = $scope.activeDimensions.filter(e => e.suggestion);
    // Call uniques endpoint single time
    // const uniquesPromise = $http.post('/api/entries/uniques/', {
    //   query: $scope.query,
    //   suggestions: activeDimensionsWithSuggestions.map(e => e.suggestion),
    //   fields: activeDimensionsWithSuggestions.map(e => e.field)
    // }).then(e => {
    //   $scope.uniques = e.data;
    // });

    // Call uniques endpoint multiple times
    let uniques = {};
    const uniquesPromiseResults = await Promise.all(activeDimensionsWithSuggestions.map(e => $http.post('/api/entries/uniques/', {
      query: $scope.query,
      suggestions: [e.suggestion],
      fields: [e.field]
    })));
    for (let result of uniquesPromiseResults) {
      uniques = {...uniques, result};
    }
    $scope.uniques = uniques;

    if (query === null) {
      // Run only uniques, not query.
      $scope.searching = true;
      await uniquesPromise;
      $scope.searching = false;
    }
    else {
      const queryPromise = someQuery(query).then(queryData => {
        entryHighlightingService.saveQuery(queryData.request);
        $scope.entries = queryData.entries;
        if (queryData.entries.length) {
          $scope.noResults = false;
        }
        else {
          $scope.noResults = true;
        }
        $('[data-toggle="tooltip"]').tooltip();
      });
      
      $scope.searching = true;
      await Promise.all([queryPromise, uniquesPromise]);
      $scope.searching = false;
    }
  };

  function queryUpdated(query){
    for (var k in query){
      if (!/\S/.test(query[k]) && !(query[k].length == 1 && query[k][0] === "")) {
          delete query[k];
        }
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
        zip.file("Travelers.tsv", entries);
        zip.file("Travelers_Life_Events.tsv", activities);
        zip.file("Travelers_Itineraries.tsv", travels);
        zip.file("LICENSE", "Data derived from Grand Tour Explorer, created by Giovanna Ceserani and Giorgio Caviglia, and populated with Giovanna Ceserani et als (2018), \"The Grand Tour Project Database: Travelers, Travelers Life Events and Travelers Itineraries.\" Stanford Digital Repository. Available at http://purl.stanford.edu/TBE, and licensed under a Creative Commons Attribution 3.0 Unported License.");
        var content = zip.generate({type:"blob"});
        saveAs(content, "Grand Tour Explorer - Export.zip");
        $btn.button('reset')

      })



  }


  function clean(obj){
    return obj;
  }

  $scope.clear = function(){
    $scope.query = {};
    $scope.entries = [];
  }
  $scope.duplicate = function() {
    window.open(window.location.href, '_blank');
  }

  $scope.removeFromQuery = function(k){
    delete $scope.query[k];
  }

  $('.tooltip').remove();
  $('[data-toggle="tooltip"]').tooltip()

  //  download counts
  $http.get('/api/getcount')
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else $scope.counts = res.data.counts;
  });

}];