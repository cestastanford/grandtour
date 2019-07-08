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
    { type : 'facet', active : false, label : 'Traveler names', description: 'Names of travelers, generally listed by names by which they first traveled.', field : 'fullName', suggestions : 'fullName', sorting : 'fullName' },
    { type : 'date', active : false, label : 'Birth date', description: 'Date of birth searchable by either exact year or within a range of years.', field : 'birthDate', sorting : 'dates[0].birthDate' },
    { type : 'facet', active : false, label : 'Birth place', description: 'Birth place by city or country.', field : 'birthPlace', suggestions : 'places.birthPlace', sorting : 'places[0].birthPlace' },
    { type : 'date', active : false, label : 'Death date', description: 'Date of birth searchable by either exact year or within a range of years.', field : 'deathDate', sorting : 'dates[0].deathDate' },
    { type : 'facet', active : false, label : 'Death place', description: 'Death place by city or country.', field : 'deathPlace', suggestions : 'places.deathPlace', sorting : 'places[0].deathPlace' },
    { type : 'facet', active : false, label : 'Gender', description: 'Gender of travelers as recorded by Ingamells.', field : 'type', suggestions : 'type' },
    { type : 'facet', active : true, label : 'DBITI Employments & Identifiers', description: 'Employment or identifier, as assigned by Ingamells at the start of an entry to serve as a brief "definition".', field : 'pursuits', suggestions : 'pursuits.pursuit' },
    { type : 'facet', active : false, label : 'Occupations & Posts', description: 'Occupations and posts parsed from the body of an entry.', field : 'occupations', suggestions : 'occupations.title' },
    { type : 'facet', active : true, label : 'Occupations & Posts', subgroup: 'Group', description: 'Broader categories of occupations and posts.', field : 'occupations_group', suggestions : 'occupations.group' },
    { type : 'facet', active : true, label : 'Societies & Academies', description: 'Societies and academies affiliated with travelers.', field : 'societies', suggestions : 'societies.title' },
    { type : 'facet', active : false, label : 'Societies & Academies', subgroup: 'Role', description: 'Positions that travelers held in relation to their societies and academies.', field : 'societies_role', suggestions : 'societies.role' },
    { type : 'facet', active : true, label : 'Education', subgroup: 'Institution', description: 'Institution of education.', field : 'education_institution', suggestions : 'education.institution' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Place', description: 'Location of education.', field : 'education_place', suggestions : 'education.place' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Teacher', description: 'Teacher of travelers.', field : 'education_teacher', suggestions : 'education.teacher' },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Degree', description: 'Degree of travelers.', field : 'education_degree', suggestions : 'education.fullDegree' },
    { type : 'facet', active : false, label : 'Military careers', description: 'Ranks within armed forces.', field : 'military', suggestions : 'military.rank' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Institution', description: 'Institution associated with exhibitions and awards.', field : 'exhibitions', suggestions : 'exhibitions.title' },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Award type', description: 'Type of award.', field : 'exhibitions_activity', suggestions : 'exhibitions.activity' },

    { type : 'facet', active : false, label : 'Mentioned names', description: 'Names that appear in the body of an entry.', field : 'mentionedNames', suggestions : 'mentionedNames.name' },
    { type : 'facet', active : false, label : 'Footnotes', description: 'Citations as recorded by Ingamells.', field : 'consolidated_notes', suggestions : 'consolidated_notes' },
    { type : 'facet', active : false, label : 'Travel place', description: 'Location visited by a traveler.', field : 'travelPlace', suggestions : 'travels.place' },
    { type : 'date', active : false, label : 'Travel date', description: 'Dates that travelers toured, by month and year.', field : 'travelDate'},
    { type : 'freesearch', active : false, label : 'Word search in the entries', description: 'Keywords in entries, with options to find all cases that match the beginning or end of the word, in case of spelling changes; or find all cases that do not mention the word. Word search can further be specified for the particular portion of an entry.', field : 'entry' },
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
    for (var i = 0; i < dimensions.length; i++) {
      if (!dimensions[i].active) {
        $scope.removeFromQuery(dimensions[i].field);
      }
    }
  }, true)

  $scope.search = function(){
    $location.path('explore/' + JSON.stringify(clean($scope.query)) );
  }

  var someQuery = httpQuery('/api/entries/search');

  var runQuery = function (query) {
    var httpPromise = someQuery(query);
    $scope.searching = true;
    httpPromise.then(function (data) {
      entryHighlightingService.saveQuery(data.request);
      $scope.searching = false;
      $scope.entries = data.entries;
      if (data.entries.length) $scope.noResults = false;
      else $scope.noResults = true;
      $('[data-toggle="tooltip"]').tooltip()
    });
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
