/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce, $timeout) {

  if($stateParams.id) {
    // save
    $scope.id = parseInt($stateParams.id);
    $http.get('/api/entries/' + $stateParams.id )
    .success(function (res){
      $scope.entry = res.entry;
      if (!res.entry) $scope.noEntry = true;
      else $scope.noEntry = false;
      //createNotes(res.entry.notes);
      createTours(res.entry.travels);
      $timeout(smartquotes);
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

    return $sce.trustAsHtml(text.replace(/(\.|\,|'|;|[a-z])([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer));
  }

  $scope.$watch( function(){ return $('.check-html').html(); }, function(html){
    $(function () {
      $('[data-toggle="popover"]').popover({trigger:'hover', placement:'top', container:'body'});
    })
  })

  //$(window).load(smartquotes);



})
