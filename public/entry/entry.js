/*
* Entry view controller
*/

app.controller('EntryCtrl', function($scope, $http, $stateParams, $sce, $timeout, $location, listService, MiniMapService, $compile, $interval, entryHighlightingService, $window) {

  if($stateParams.id) {
    // save
    $scope.id = parseInt($stateParams.id);
    $http.get('/api/entries/' + $stateParams.id )
    .success(function (res){
      $scope.entry = res.entry;
      $scope.nextIndex = res.next;
      $scope.previousIndex = res.previous;
      if (!res.entry) $scope.noEntry = true;
      else {

        $scope.noEntry = false;

        createTours(res.entry.travels);
        createOccupations(res.entry.occupations);
        createMilitary(res.entry.military);
        downloadMentionedNames(res.entry.mentionedNames);
        linkFootnotes();

        // $timeout(smartquotes);
        $timeout(function(){ $('[data-toggle="tooltip"]').tooltip(); })

        setupMinimap();

      }

      setupEditing();

    })
  }

  $scope.splitTours = function(tours) {
    return tours ? tours.split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g) : []
  }

  $scope.highlighted = function(propertyName, value, doNotTrust) {
    if (value) {
      var highlightedHtml = entryHighlightingService.highlight(propertyName, value);
      return doNotTrust ? highlightedHtml : $sce.trustAsHtml(highlightedHtml);
    }
  }

  $scope.highlightTravel = entryHighlightingService.highlightTravel;

  function createTours(travels){
    if (!travels) return;
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
    $scope.military = military ? military.filter(function(d){ return d.rank; }) : [];
  }

  function downloadMentionedNames(mentionedNames) {
    Promise.all(mentionedNames.map(function(name) {
      if (name.entryIndex) return $http.get('/api/entries/' + name.entryIndex)
      else return (Promise.resolve(null))
    }))
    .then(function(responses) {
      responses.forEach(function(response, i) {
        if (response) mentionedNames[i].entry = response.data.entry
      })
    })
    .catch(console.error.bind(console))
  }

  function linkFootnotes() {
    $http.get('/api/linked-footnotes/in-entry/' + $scope.entry.index)
    .then(function(response) {

      var notes = $scope.entry.notes
      var linkedFootnotes = response.data.sort(function(a, b) { return a.startIndex - b.startIndex })
      var linkedNoteNodes = []
      var previousEndIndex = 0
      if (linkedFootnotes.length) {

        linkedFootnotes.forEach(function(footnote, i) {

          var popoverText = footnote.fullText
          var linkDestination = '/#/search/' + encodeURIComponent(JSON.stringify({
            entry: { 
              terms: [ { value: footnote.abbreviation } ],
              sections: [
                { key: 'biography', name: 'Biography', checked: false },
                { key: 'narrative', name: 'Narrative', checked: false },
                { key: 'tours', name: 'Tours', checked: false },
                { key: 'notes', name: 'Notes', checked: true }
              ],
              beginnings: false,
            }
          }))

          linkedNoteNodes.push({ link: false, text: notes.slice(previousEndIndex, footnote.startIndex) })
          linkedNoteNodes.push({ link: true, linkDestination: linkDestination, popoverText: popoverText, text: notes.slice(footnote.startIndex, footnote.endIndex) })
          if (i === linkedFootnotes.length - 1) linkedNoteNodes.push({ link: false, text: notes.slice(footnote.endIndex) })
          else previousEndIndex = footnote.endIndex

        })

        var linkedNotes = ''
        linkedNoteNodes.forEach(function(node) {
          if (node.link) {
            linkedNotes += '<a href="' + node.linkDestination + '" data-toggle="popover" data-content="' + node.popoverText + '">'
            linkedNotes += entryHighlightingService.highlight('entry_notes', node.text)
            linkedNotes += '</a>'
          } else linkedNotes += entryHighlightingService.highlight('entry_notes', node.text)
        })

        $scope.entry.linkedNotes = $sce.trustAsHtml(linkedNotes);
        $timeout(function() {
          $('[data-toggle="popover"]').popover({ trigger: 'hover', placement: 'top', container: 'body' });
          $('[data-toggle="popover"]').click(function(event) { $('.popover').remove() })
        })

      } else $scope.entry.linkedNotes = $scope.entry.notes

    })
    .catch(console.error.bind(console))
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

  $scope.superscript = function(text, n, trustAsHtml) {
    if (!text) return;
    var notes =  n ? createNotes(n) : [];
    function replacer(match, p1, p2, p3, offset, string) {
      var t = p2 == 1? notes[p2-1] : p2 + ". " +  notes[p2-1];
      return p1 + "<sup class=\"text-primary\" data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>";
    }

    var textWithNotes = text.replace(/(\.|\,|'|;|[a-z]|[0-9]{4})([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer);
    return trustAsHtml ? $sce.trustAsHtml(textWithNotes) : textWithNotes;
  }

  $scope.search = function(query){
    $location.path('search/' + JSON.stringify(query) );
  }

  $scope.searchTravel = function(travel) {

    var travelQuery = { place: travel.place };

    if (travel.travelStartYear || travel.travelEndYear) {

        travelQuery.date = {};

        if (travel.travelStartYear) {
          travelQuery.date.startYear = travel.travelStartYear;
          if (travel.travelStartMonth) {
            travelQuery.date.startMonth = travel.travelStartMonth;
            if (travel.travelStartDay) {
              travelQuery.date.startDay = travel.travelStartDay;
            }
          }
        }

        if (travel.travelEndYear) {
          travelQuery.date.endYear = travel.travelEndYear;
          if (travel.travelEndMonth) {
            travelQuery.date.endMonth = travel.travelEndMonth;
            if (travel.travelEndDay) {
              travelQuery.date.endDay = travel.travelEndDay;
            }
          }
        }

    }

    $location.path('search/' + JSON.stringify({ travel: travelQuery }));

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

  //  initialize view model
  var viewModel = {
      newListName: ''
  };

  //  expose view model to scope
  $scope.viewModel = viewModel;

  //  expose shared list model to scope
  $scope.sharedListModel = listService.sharedListModel;

  $scope.addSelectedEntriesToList = function(list) {
    var entry = $scope.entry;
    entry.addedToList = entry.alreadyInList = false;
    listService.addToList(list, entry, function(result) {
      if (result.addedToList) {
        entry.addedToList = true;
      }
      if (result.alreadyInList) entry.alreadyInList = true;
    });
  };

  $scope.addSelectedEntriesToNewList = function() {
    listService.newList(viewModel.newListName, function(list) {
      viewModel.newListName = '';
      console.log('list created: ' + list.name);
      $scope.addSelectedEntriesToList(list);
    });
  };

  function setupMinimap() {

    if ($scope.entry.travels) {

      $scope.miniMapShared = MiniMapService.miniMapShared;
      $scope.miniMapShared.travels = $scope.entry.travels;

      var directiveHTML = '<traveler-points-mini-map></traveler-points-mini-map>';
      var miniMapElement = $compile(directiveHTML)($scope);

      var wrapperElement = angular.element(document.getElementById('minimap'));
      wrapperElement[0].innerHTML = '';
      wrapperElement.append(miniMapElement);

      doInitialAnimation($scope.entry.travels);
      $scope.reanimate = doInitialAnimation;

    }

  }

  //  Hovers over every element.
  function doInitialAnimation(travels) {

    var ANIMATION_INTERVAL = 500;
    var i = 0;

    $interval(next, ANIMATION_INTERVAL, travels.length + 1);

    function next() {

      if (i > 0) $scope.miniMapShared.travelUnhovered(travels[i - 1]);
      if (i < travels.length) $scope.miniMapShared.travelHovered(travels[i]);
      i++;

    };
  }


  /*
  * Sets up the Edit bar for the entry.
  */

  function setupEditing() {

    $http.get('/loggedin')
    .then(function(response) {

      var user = response.data
      if (user.role === 'editor' || user.role === 'admin') {

        var editStatus = {}
        if (user.activeRevisionIndex !== null) editStatus.mustActivateLatest = true
        if ($scope.entry) editStatus.exists = true
        $scope.editStatus = editStatus

      }

    })

  }


  /*
  * Deletes the current entry.
  */

  $scope.deleteEntry = function() {
    
    if ($window.confirm('Are you sure you want to delete this entry?')) {
      
      $scope.editStatus.deleting = true
      $http.delete('/api/entries/' + $scope.entry.index)
      .then(function() {
        $scope.editStatus.deleting = false
        $window.location.reload()
      })
      .catch(console.error.bind(console))
    
    }

  }


  /*
  * Creates a new entry with the current index.
  */

  $scope.createEntry = function() {

    $scope.editStatus.creating = true
    $http.put('/api/entries/' + $stateParams.id, { fullName: 'New Entry' })
    .then(function() {
      $scope.editStatus.creating = false
      $window.location.reload()
    })
    .catch(console.error.bind(console))

  }

});