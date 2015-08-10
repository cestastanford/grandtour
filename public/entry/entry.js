/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce, $timeout, $location) {

  if($stateParams.id) {
    // save
    $scope.id = parseInt($stateParams.id);
    $http.get('/api/entries/' + $stateParams.id )
    .success(function (res){
      $scope.entry = res.entry;
      if (!res.entry) $scope.noEntry = true;
      else $scope.noEntry = false;

      createTours(res.entry.travels);
      createOccupations(res.entry.occupations);
      createMilitary(res.entry.military);

      $timeout(smartquotes);
      $timeout(function(){ $('[data-toggle="tooltip"]').tooltip(); })
    })
  }

  function createTours(travels){
    var nest = d3.nest()
    .key(function(d) { return d.tourIndex; })
    .entries(travels);

    nest.forEach(function(d){
      d.start = d.values[0].tourStartFrom;
      d.end = d.values[0].tourEndFrom;
    })

    $scope.tours = nest;
  }

  function createMilitary(military){
    $scope.military = military.filter(function(d){ return d.rank; })
  }

  function createOccupations(occupations){
    if (!occupations) return;
    var nest = d3.nest()
    .key(function(d) { return d.group; })
    .entries(occupations);
    $scope.occupations = nest;
  }

  function createNotes(notes){
    return notes.split(/\.\s[0-9]{1,2}\.\s/gi);
  }

  $scope.superscript = function(text, n){
    if (!text) return;
    var notes =  n ? createNotes(n) : [];
    function replacer(match, p1, p2, p3, offset, string) {
      var t = p2 == 1? notes[p2-1] : p2 + ". " +  notes[p2-1];
      return p1 + "<sup class=\"text-primary\" data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>";
    }

    return $sce.trustAsHtml(text.replace(/(\.|\,|'|;|[a-z]|[0-9]{4})([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer));
  }

  $scope.search = function(query){
    $location.path('search/' + JSON.stringify(clean(query)) );
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

  $scope.$watch( function(){ return $('.check-html').html(); }, function(html){
    $(function () {
      $('[data-toggle="popover"]').popover({trigger:'hover', placement:'top', container:'body'});
    })
  })

  //$(window).load(smartquotes);



})
