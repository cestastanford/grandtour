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

  const BOOK_URL = "https://ceserani.github.io/gt-book";

  $scope.dimensions = [
    { type : 'facet', active : false, label : 'Traveler name', description: 'The names of the 6007 travelers in the database, including alternate names. ', field : 'fullName', suggestion: 'fullName', sorting : 'fullName', href: `${BOOK_URL}/presenting-the-data#paragraph-23` },
    { type : 'index', active : false, label : 'Entry ID', description: 'The unique numeric identifier attributed to each traveler who has an entry in the database.', field : 'index', suggestion: 'index', sorting : 'index', href: `${BOOK_URL}/presenting-the-data#entry-id` },
    { type : 'date', active : false, label : 'Birth date', description: '', field : 'birthDate', sorting : 'dates[0].birthDate', href: `${BOOK_URL}/presenting-the-data#paragraph-28` },
    { type : 'facet', active : false, label : 'Birth place', description: '', field : 'birthPlace', suggestion: 'places.birthPlace', sorting : 'places[0].birthPlace', href: `${BOOK_URL}/presenting-the-data#paragraph-36` },
    { type : 'date', active : false, label : 'Death date', description: '', field : 'deathDate', sorting : 'dates[0].deathDate', href: `${BOOK_URL}/presenting-the-data#paragraph-31` },
    { type : 'facet', active : false, label : 'Death place', description: 'The place of death—ranging from town to country—of travelers in the database.The death place is recorded for 5.3% of the travelers.', field : 'deathPlace', suggestion: 'places.deathPlace', sorting : 'places[0].deathPlace', href: `${BOOK_URL}/presenting-the-data#paragraph-40` },
    { type : 'facet', active : false, label : 'Gender', field : 'type', suggestion: 'type', href: `${BOOK_URL}/presenting-the-data#gender` },
    { type : 'facet', active : true, label : 'DBITI Employments & Identifiers', description: '', field : 'pursuits', suggestion: 'pursuits.pursuit', href: `${BOOK_URL}/presenting-the-data#paragraph-46` },
    { type : 'facet', active : false, label : 'Occupations & Posts', description: 'Occupations and posts—ranging from political appointments and honors to trades and crafts—held by travelers. There are records for 256 such positions and professions for about 25% of travelers in the database.', field : 'occupations', suggestion: 'occupations.title', href: `${BOOK_URL}/presenting-the-data#paragraph-54` },
    { type : 'facet', active : true, label : 'Occupations & Posts', subgroup: 'Group', description: 'The eleven groupings into which occupations and posts are gathered thematically to facilitate interrogation of the data.', field : 'occupations_group', suggestion: 'occupations.group', href: `${BOOK_URL}/presenting-the-data#paragraph-54` },
    { type : 'facet', active : true, label : 'Societies & Academies', description: 'The twenty-four cultural, scientific, and artistic associations for which there are records of affiliation in the database. For only 8.3% of the travelers there are such records.', field : 'societies', suggestion: 'societies.title', href: `${BOOK_URL}/presenting-the-data#paragraph-65` },
    { type : 'facet', active : false, label : 'Societies & Academies', subgroup: 'Role', description: 'The role played by the travelers in the societies or academies to which they are affiliated in the database’s records.', field : 'societies_role', suggestion: 'societies.role', href: `${BOOK_URL}/presenting-the-data#paragraph-65` },
    { type : 'facet', active : true, label : 'Education', subgroup: 'Institution', description: 'The 107 institutions of education—ranging from preparatory schools to universities and academies—that are recorded for 18.4% of the travelers in the database.', field : 'education_institution', suggestion: 'education.institution', href: `${BOOK_URL}/presenting-the-data#paragraph-50` },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Place', description: 'The sixty-nine locations—ranging from town to country—where the travelers were educated. This data is recorded for just over 19% of the travelers in the database.', field : 'education_place', suggestion: 'education.place', href: `${BOOK_URL}/presenting-the-data#paragraph-50` },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Teacher', description: 'The ninety-six teachers recorded as educators for 104 travelers in the database (less than 2% of all travelers).', field : 'education_teacher', suggestion: 'education.teacher', href: `${BOOK_URL}/presenting-the-data#paragraph-50` },
    { type : 'facet', active : false, label : 'Education', subgroup: 'Degree', description: 'The twelve types of degrees that are recorded for 126 travelers in the database (just over 2% of all travelers).', field : 'education_degree', suggestion: 'education.fullDegree', href: `${BOOK_URL}/presenting-the-data#paragraph-50` },
    { type : 'facet', active : false, label : 'Military careers', description: '', field : 'military', suggestion: 'military.rank', href: `${BOOK_URL}/presenting-the-data#paragraph-62` },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Institution', description: 'Institutions: The ten institutions sponsoring art exhibitions or educational fellowships, which appear in 419 records, pertaining to 2.4% of the travelers in the database.', field : 'exhibitions', suggestion: 'exhibitions.title', href: `${BOOK_URL}/presenting-the-data#paragraph-69` },
    { type : 'facet', active : false, label : 'Exhibitions & Awards', subgroup: 'Award type', description: 'Awards type: The awards gained in art exhibitions and educational fellowships awarded which are recorded for 0.4% of the travelers in the database.', field : 'exhibitions_activity', suggestion: 'exhibitions.activity', href: `${BOOK_URL}/presenting-the-data#paragraph-69` },

    { type : 'facet', active : false, label : 'Mentioned names', description: '', field : 'mentionedNames', suggestion: 'mentionedNames.name', href: `${BOOK_URL}/presenting-the-data#paragraph-76` },
    { type : 'facet', active : false, label : 'Sources', description: '', field : 'sources', suggestion: 'sources.abbrev', href: `${BOOK_URL}/presenting-the-data#paragraph-72` },
    { type : 'facet', active : false, label : 'Travel place', description: '', field : 'travelPlace', suggestion: 'travels.place', href: `${BOOK_URL}/presenting-the-data#paragraph-86` },
    { type : 'date', active : false, label : 'Travel date', description: '', field : 'travelDate', href: `${BOOK_URL}/presenting-the-data#paragraph-88` },
    { type : 'freesearch', active : false, label : 'Free word search', description: '', field : 'entry', href: null },
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
    // const uniquesPromise = $http.post('/explorer/api/entries/uniques/', {
    //   query: $scope.query,
    //   suggestions: activeDimensionsWithSuggestions.map(e => e.suggestion),
    //   fields: activeDimensionsWithSuggestions.map(e => e.field)
    // }).then(e => {
    //   $scope.uniques = e.data;
    // });

    // Call uniques endpoint multiple times
    const uniquesPromise = async () => {
      let uniques = {};
      const uniquesPromiseResults = await Promise.all(activeDimensionsWithSuggestions.map(e => $http.post('/explorer/api/entries/uniques/', {
        query: $scope.query,
        suggestions: [e.suggestion],
        fields: [e.field]
      })));
      for (let result of uniquesPromiseResults) {
        uniques = {...uniques, ...result.data};
      }
      $scope.uniques = uniques;
    };

    if (query === null) {
      // Run only uniques, not query.
      $scope.searching = true;
      await uniquesPromise();
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
      await Promise.all([queryPromise, uniquesPromise()]);
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
    return $http.post('/explorer/api/entries/suggest/', {  field : field, value : value })
    .then(function (res){
      return res.data.results;//.map(function(d){ return { value: d } });
    })
  }

  $scope.export = function(field, value){

    var $btn = $('#export-button').button('loading')

    $http.post('/explorer/api/entries/export/', {  query: $scope.query } )
      .success(function (res){

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
  $http.get('/explorer/api/getcount')
  .then(function(res) {
    if (res.data.error) console.error(res.data.error);
    else $scope.counts = res.data.counts;
  });

}];