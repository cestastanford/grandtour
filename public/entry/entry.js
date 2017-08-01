/**********************************************************************
 * Entries controller
 **********************************************************************/
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
    console.log('text and notes: ', text, notes);
    function replacer(match, p1, p2, p3, offset, string) {
      var t = p2 == 1? notes[p2-1] : p2 + ". " +  notes[p2-1];
      return p1 + "<sup class=\"text-primary\" data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>";
    }

    var textWithNotes = text.replace(/(\.|\,|'|;|[a-z]|[0-9]{4})([0-9]{1,2})(?=\s|$|\n|\r)/gi, replacer);
    console.log('text with notes: ', textWithNotes);
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


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * /
*
*   travelerPointsMiniMap.js (JavaScript)
*   written by Cody M Leff for the Grand Tour project
*   CESTA – Stanford University
*/

/*
*   This script creates an AngularJS module for the Traveler Points map meant
*   to be embedded within the traveler detail page of the Grand Tour web app.
*   To add to the site, add this module as a dependency for whatever module
*   manages the page, import the MiniMapService service into the controller
*   that manages the travel destination list and bind the appropriate fields
*   and methods, then include a <traveler-points-mini-map> element in the HTML
*   to call the directive.
*/

//  This is the service that connects to the mini map controller.
app.factory('MiniMapService', function() {

    var miniMapShared = {

        travels: null,
        travelHovered: travelHovered,
        travelUnhovered: travelUnhovered,
        travelClicked: travelClicked,

    };

    return {

        miniMapShared: miniMapShared,

    };

});


//  This is the mini map controller.
app.controller('MiniMapController', function($scope, MiniMapService) {

    $scope.miniMapShared = MiniMapService.miniMapShared;

});


//  This is the mini map directive for HTML inclusion.
app.directive('travelerPointsMiniMap', function() {

    return {

        restrict: 'E',
        link: function(scope, element, attrs) {

            setupVisualization(element[0], scope.miniMapShared.travels, function() { scope.$apply(); });

        },

    };

});


// ------------------ Visualization Setup ------------------ //

//  Constants
var MAP_HEIGHT = 250;
var MAP_WIDTH = 262;    //  used
var BASEMAP_CENTER = [12.75, 42.05];
var BASEMAP_SCALE = 1000;

var MIN_POINT_RADIUS = 1;
var MAX_POINT_RADIUS = 15;
var HOVER_SIZE_INCREASE = 5;
var TEXT_MARGIN_TOP = 5;
var ONE_DAY_MS = 1000 * 60 * 60 * 24;

//  This value was calculated by averaging the length of every traveler's
//  visit to any destination that was exactly defined to the day.
var AVG_STAY_DAYS = 26;

var CLICKED_COLOR = '#88f';
var UNCLICKED_COLOR = '#888';
var ANIMATION_DELAY = 150;

//  Instance variables
var canvas, projection, uniqueDestinations, pointScale, key, points, targets, labels;


//  moveToFront function
var moveToFront = d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


//  sets up the visualization canvas
function setupVisualization(element, travels, applyFn) {

    canvas = d3.select(element).append('svg').attr('width', MAP_WIDTH).attr('height', MAP_HEIGHT);

    drawBasemap();

    //  check if there are travels
    var n_travels = travels ? travels.length : 0;

    if (n_travels) {

        //  filter out the points with no location data
        travelsWithLocation = travels.filter(function(destination) {
            return destination.latitude ? true : false;
        });

        uniqueDestinations = findUniqueDestinations(travelsWithLocation);
        drawDestinationPoints();
        addListeners(applyFn)

    }


};

//  display the basemap
function drawBasemap() {

    //  set up mercator projection with map centered and
    //  scaled on region of interest.
    projection = d3.geo.mercator()
        .center(BASEMAP_CENTER)
        .scale(BASEMAP_SCALE)
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

    var path = d3.geo.path().projection(projection);

    //  download the basemap data and draw path
    d3.json('italy_outline.json', function(error, data) {

        canvas.insert('path', 'svg :first-child')
        .datum(data)
        .attr('d', path)
        .classed('basemap', true);

    });
};


// ------------------ Visualization Function ------------------ //

/*
*   Function: drawDestinationPoints
*   -------------------------------
*   Draws a point with radius POINT_RADIUS at the location of each
*   destination, animating its appearance.
*/
function drawDestinationPoints() {

    //  reduce stayLengths to a total
    var totalStayLengths = uniqueDestinations.reduce(function(accum, next) {

        return accum + next.stayLength;

    }, 0);

    //  calculate the point scale
    pointScale = d3.scale.linear()
    .domain([0, totalStayLengths])
    .range([MIN_POINT_RADIUS, MAX_POINT_RADIUS]);

    //  create point elements
    points = canvas.selectAll('circle .point')
    .data(uniqueDestinations)
    .enter()
    .append('circle')
    .classed('point', true)
    .attr('cx', function(d) { return d.xy[0]; })
    .attr('cy', function(d) { return d.xy[1]; })
    .attr('r', 0)
    .style('stroke', UNCLICKED_COLOR)
    .style('fill', UNCLICKED_COLOR)

    //  create hover and click targets
    targets = canvas.selectAll('circle .target')
    .data(uniqueDestinations)
    .enter()
    .append('circle')
    .classed('target', true)
    .attr('cx', function(d) { return d.xy[0]; })
    .attr('cy', function(d) { return d.xy[1]; })
    .attr('r', function(d) { return pointScale(d.stayLength) + HOVER_SIZE_INCREASE; })
    .style('stroke', 'rgba(0,0,0,0)')
    .style('fill', 'rgba(0,0,0,0)');

    //  create labels
    labels = canvas.selectAll('text')
    .data(uniqueDestinations)
    .enter()
    .append('text')
    .html(function(d) { return d.place; })
    .attr('x', function(d) { return d.xy[0]; })
    .attr('y', function(d) { return d.xy[1] + pointScale(d.stayLength) + HOVER_SIZE_INCREASE + TEXT_MARGIN_TOP; })
    .attr('font-size', '14')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'hanging')
    .classed({ hidden: true });

};


function addListeners(applyFn) {

    //  update the visualization and the shared data service on hover
    targets.on('mouseenter', function(d, i) {

        setAll(d, 'hovered', true);
        applyFn();
        hoverOn(i);

    });

    //  update the visualization and the shared data service on hover end
    targets.on('mouseleave', function(d, i) {

        setAll(d, 'hovered', false);
        applyFn();
        hoverOff(i);

    });

    //  update the visualization and the shared data service on click
    targets.on('click', function(d, i) {

        // ??

    })
};


/*
*   Function: travelHovered
*   ------------------------------
*   Called when an element is hovered over in the travel list
*   to refresh the D3 visualization.
*/
function travelHovered(travel) {

    travel.hovered = true;
    var index = uniqueDestinations.indexOf(travel.uniqueDestination);
    hoverOn(index);

};

/*
*   Function: travelUnhovered
*   ------------------------------
*   Called when an element is unhovered over in the travel list
*   to refresh the D3 visualization.
*/
function travelUnhovered(travel) {

    travel.hovered = false;
    var index = uniqueDestinations.indexOf(travel.uniqueDestination);
    hoverOff(index);

};


/*
*   Function: travelClicked
*   ------------------------------
*   Called when an element is unhovered over in the travel list
*   to refresh the D3 visualization.
*/
function travelClicked(travel) {

    var index = uniqueDestinations.indexOf(travel.uniqueDestination);

    if (miniMapService.miniMapShared.clickedDestination) {

        if (miniMapService.miniMapShared.clickedDestination === index) {

            hideDetail();
            miniMapService.miniMapShared.clickedDestination = null;

        } else {

            hideDetail();
            miniMapService.miniMapShared.clickedDestination = index;
            showDetail();

        }

    } else {

        miniMapService.miniMapShared.clickedDestination = index;
        showDetail();

    }

};

//  sets either the clicked or hovered property on all source travels
function setAll(uniqueDestination, property, value) {

    for (var i = 0; i < uniqueDestination.sourceTravels.length; i++) {

        uniqueDestination.sourceTravels[i][property] = value;

    }

};

//  restyles a point to the hovered state
function hoverOn(index) {

    var pointElement = d3.select(points[0][index]);
    var targetElement = d3.select(targets[0][index]);
    var labelElement = d3.select(labels[0][index]);

    pointElement.transition()
    .attr('r', function(d) { return pointScale(d.stayLength) + HOVER_SIZE_INCREASE; })
    .style('fill', CLICKED_COLOR)
    .style('stroke', CLICKED_COLOR);

    targetElement.moveToFront();

    labelElement.classed('hidden', false);

};

//  restyles a point to the non-hovered state
function hoverOff(index) {

    var pointElement = d3.select(points[0][index]);
    var labelElement = d3.select(labels[0][index]);

    pointElement.transition()
    .attr('r', function(d) { return pointScale(d.stayLength); })
    .style('fill', UNCLICKED_COLOR)
    .style('stroke', UNCLICKED_COLOR);

    labelElement.classed('hidden', true);

};

//  shows the detail view
function showDetail() {
    console.log('showing detail for destination ' + clickedDestination);
};

//  hides the detail view
function hideDetail() {
    console.log('hiding detail for destination ' + clickedDestination);
};

// ------------------ Utility Functions ------------------ //

/*
*   Function: findUniqueDestinations
*   -------------------------
*   This function reduces the list of travels into a list of unique
*   destinations, calculating the best guess for stay length for each
*   and keeping references to the source travel objects for each.
*/
function findUniqueDestinations(travels) {

    var uniqueDestinations = [];

    for (var i = 0; i < travels.length; i++) {

        var travel = travels[i];

        var slo = guessStayLength(travel.travelStartDay,
                    travel.travelStartMonth,
                    travel.travelStartYear,
                    travel.travelEndDay,
                    travel.travelEndMonth,
                    travel.travelEndYear);

        //  fix because some date ranges are negative from bad data
        var adjustedStayLength = Math.abs(slo.exact ? slo.exact : slo.guess);


        var filtered = uniqueDestinations.filter(function(element) {
            return element.place === travel.place;
        });

        matching = filtered[0];

        if (!matching) {

            var newUniqueDestination = {

                place: travel.place,
                visits: 1,
                stayLength: adjustedStayLength,
                xy: projection([travel.longitude, travel.latitude]),
                sourceTravels: [travel],
                hovered: false,
                clicked: false,

            }

            uniqueDestinations.push(newUniqueDestination);
            matching = newUniqueDestination;

        } else {

            matching.visits++;
            matching.stayLength += adjustedStayLength;
            matching.sourceTravels.push(travel);

        }

        travel.uniqueDestination = matching;

    };

    return uniqueDestinations;
};


/*
*   Function: guessStayLength
*   -------------------------
*   This function receives a set of stay length parameters and
*   returns its best guess for the stay length.  If the start
*   and end dates are both defined to the day, an exact number
*   of days is returned.  If only the start or end date is
*   present, or both are present and identical but not defined
*   to the day, the average stay length of 26 days is returned.
*   If the start and date are both present and different but not
*   defined to the day, the function returns the upper and lower
*   bounds of the range of possible stay lengths, along with the
*   average of them as a guess.
*/
var guessStayLength = function(startDay, startMonth, startYear, endDay, endMonth, endYear) {

    //  if either start or end has no data:
    //  return the average difference
    if ((!startDay && !startMonth && !startYear) || (!endDay && !endMonth && !endYear)) {
    //    console.log(arguments);
        return { guess: AVG_STAY_DAYS };
    }

    //  if start and end are both exact to the day:
    //  return an exact difference
    if (startDay && startMonth && startYear && endDay && endMonth && endYear) {
    //    console.log(arguments);
        return {

            exact: getDayDiff(new Date(startYear, startMonth - 1, startDay),
                new Date(endYear, endMonth - 1, endDay + 1))
        };
    }

    //  if start and end are identical, but not exact to the day:
    //  return the average difference
    if (startDay === endDay && startMonth === endMonth && startYear === endYear) {
    //    console.log(arguments);
        return { guess: AVG_STAY_DAYS }
    }

    // console.log(arguments);

    //  For all other cases: calculate the possible start dates
    //  and end dates.
    var startDateLowerBound;
    var startDateUpperBound;
    var EndDateLowerBound;
    var EndDateUpperBound;

    //  calculate possible start dates
    if (startDay && startMonth && startYear) {

        startDateLowerBound = startDateUpperBound =
            new Date(startYear, startMonth - 1, startDay);

    } else if (startMonth) {

        var startDateLowerBound = new Date(startYear, startMonth - 1, 1);
        var startDateUpperBound = new Date(startYear, startMonth, 0);

    } else {

        var startDateLowerBound = new Date(startYear, 0, 1);
        var startDateUpperBound = new Date(startYear + 1, 0, 0);

    }
    // console.log(startDateLowerBound, startDateUpperBound);

    //  calculate possible end dates
    if (endDay && endMonth && endYear) {

        endDateLowerBound = endDateUpperBound =
            new Date(endYear, endMonth - 1, endDay);

    } else if (endMonth) {

        var endDateLowerBound = new Date(endYear, endMonth - 1, 1);
        var endDateUpperBound = new Date(endYear, endMonth, 0);

    } else {

        var endDateLowerBound = new Date(endYear, 0, 1);
        var endDateUpperBound = new Date(endYear + 1, 0, 0);

    }

    //  calculate the upper and lower bounds of the range
    var stayLengthLowerBound = getDayDiff(startDateUpperBound, endDateLowerBound);
    var stayLengthUpperBound = getDayDiff(startDateLowerBound, endDateUpperBound);

    return {

        guess: (stayLengthLowerBound + stayLengthUpperBound) / 2,
        range: [stayLengthLowerBound, stayLengthUpperBound],
    };
}


/*
*   Function: getDayDiff
*   --------------------
*   This function calculates the number of days between two Date
*   objects.
*/
var getDayDiff = function(date_1, date_2) {

    //  get difference between dates in milliseconds
    var diff_ms = date_2.getTime() - date_1.getTime();

    //  return this difference in days
    return diff_ms / ONE_DAY_MS;
};


/*
*   Function: getAverageStay
*   ------------------------
*   This function finds the average stay length across all
*   travels; used just for data gathering.
*/
var getAverageStay = function() {

    var n_stays_total = 0;
    var exact_stays = [];
    var n_travelers = 0;

    for (var i = 0; i < TOTAL_TRAVELERS; i++) {

        d3.json(API_URL + i, function(data) {

            n_travelers++;
            var travels = data.entry.travels;
            if ((travels ? travels.length : 0) > 0) {

                for (var j = 0; j < travels.length; j++) {

                    n_stays_total++;
                    var d = travels[j];

                    if (d.travelStartDay &&
                        d.travelStartMonth &&
                        d.travelStartYear &&
                        d.travelEndDay &&
                        d.travelEndMonth &&
                        d.travelEndYear) {

                        var start = new Date(d.travelStartYear, d.travelStartMonth - 1, d.travelStartDay);
                        var end = new Date(d.travelEndYear, d.travelEndMonth - 1, d.travelEndDay);

                        var diff = getDayDiff(start, end);

                        exact_stays.push(diff);

                    }

                }

            }

            if (n_travelers % 100 === 0 || n_travelers === TOTAL_TRAVELERS) {

                console.log(n_travelers + ' travelers counted, ' +
                    n_stays_total + ' total stays found, ' +
                    exact_stays.length + ' exact stays found.');
                var sum = exact_stays.reduce(function(accum, next) { return accum + next; }, 0);
                var average = sum / exact_stays.length;
                console.log('average stay length: ' + average + ' days');
                var sumOfSquares = exact_stays.reduce(function(accum, next) { return accum + Math.pow(average - next, 2); }, 0);
                var stdDev = Math.sqrt(sumOfSquares / exact_stays.length);
                console.log('stay length standard deviation: ' + stdDev);

            }

        });

    }

};
