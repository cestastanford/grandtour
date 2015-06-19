/**********************************************************************
 * Entries controller
 **********************************************************************/
app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce) {

  if($stateParams.id) {
    $http.get('/api/entries/' + $stateParams.id )
    .success(function (res){
      $scope.entry = res.entry;

      createNotes(res.entry.notes);
    })
  }

  function createNotes(notes){
    $scope.notes = notes.split(/\.\s[0-9]{1,2}\.\s/gi);
  }

  $scope.superscript = function(text){
    if (!text) return;

    function replacer(match, p1, p2, p3, offset, string) {
      var t = p2 == 1? $scope.notes[p2-1] : p2 + ". " +  $scope.notes[p2-1];
      return p1 + "<sup data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>";
    }

    return $sce.trustAsHtml(text.replace(/(\.|\,|[a-z])([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer));
  }

  $scope.$watch( function(){ return $('.check-html').html(); }, function(html){
    $(function () {
      $('[data-toggle="popover"]').popover({trigger:'hover', placement:'top', container:'body'});
    })
  })



})
