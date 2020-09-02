import mapboxgl from "mapbox-gl";
import { find } from "lodash";
/*
  This script provides the functionality for the Map Visualization, which appears within visualization.component.ts. Places of the Grand Tour
  are drawn as features (i.e., points) according to information based from Mapbox and can be selected individually or by state using buttons.
*/

interface IFeature {
  id: Number,
  layer: any,
  type: string,
  properties: {
    "id": number,
    "place": string,
    "latitude": number,
    "longitude": number,
    "cc_count": number,
    "cc_class": number,
    "GTE_States_18thcentury state": string
  },
  source: string,
  sourceLayer: string,
  state: {}
  geometry: {
    type: string,
    coordinates: [number, number]
  }
}
interface IPoint {
  showLabel: boolean,
  selected: boolean,
  wasHovered: boolean,
  selectedPopup?: any,
  placeButton?: HTMLButtonElement,
  feature: IFeature
}

interface IState {
  name: string,
  color: string,
  buttonElement?: HTMLDivElement,
  selected?: boolean
}

function init() {
  // sets up map
  mapboxgl.accessToken = 'pk.eyJ1IjoicnlhbmN0YW4iLCJhIjoiY2p6cmZpb3c1MGtweTNkbjR2dGRrMHk5ZiJ9.H8nXUqRjABlGumy-D8fA7A'; // replace this with your access token
  let map = new mapboxgl.Map({
    container: 'map',
    style: require('./style.json'),
    center: [13, 41],
    zoom: 4.6,
  });

  let points: IPoint[] = [];

  /*
   * Sets up states interaction. Places comprise states, such that every place has a state it belongs to.
   */
  let stateElements: IState[] = [
    { name: 'Papal States', color: '#a879af' },
    { name: 'Grand Duchy of Tuscany', color: '#89d792' },
    { name: 'Duchy of Modena, Massa and Carrara', color: '#f8de91' },
    { name: 'Republic of Venice', color: '#89b6d7' },
    { name: 'Duchy of Milan and Mantua', color: '#d7bd75' },
    { name: 'Bishopric of Trento', color: '#ce977e' },
    { name: 'Kingdom of Naples', color: '#f0b97f' },
    { name: 'House of Savoy/Kingdom of Sardinia', color: '#71808e' },
    { name: 'Republic of Lucca', color: '#ce977e' },
    { name: 'Duchy of Parma and Piacenza', color: '#83aa89' },
    { name: 'Republic of Genoa', color: '#ab7879' },
    { name: 'Duchy of Sora', color: '#77ac85' },
    { name: 'Republic of San Marino', color: '#81b9da' },
    { name: 'Tyrol', color: '#fdde86' },
  ];

  /* For use in Search */
  let lowerCaseAlternate = new Map();
    lowerCaseAlternate["aix in savoy"] = "aix";
    lowerCaseAlternate["antium"] = "anzio";
    lowerCaseAlternate["cuma"] = "cumae";
    lowerCaseAlternate["leghorn"] = "livorno";
    lowerCaseAlternate["pola in istria"] = "pola";
    lowerCaseAlternate["roverodo"] = "rovereto";
    lowerCaseAlternate["trent"] = "trento";
    lowerCaseAlternate["the veneto"] = "veneto";
  
  const search = <HTMLInputElement>document.getElementById("searchbar");
  const states = document.getElementById('states');

  search.addEventListener("search", searchMap);

  function searchMap() {
    var rawInput = search.value;
    var input = rawInput.toLowerCase();

    // check if alternate name, and if so change it
    if (input in lowerCaseAlternate) {
      input = lowerCaseAlternate[input];
    }

    var found = points.filter(point => point.feature.properties['place'].toLowerCase() === input);
    if (found.length < 1) {
      window.alert("Could not find \"" + rawInput + "\".");
      return;
    }
    let location = found[0];
    var coordinates = location.feature.geometry.coordinates;
    map.flyTo({
      // These options control the ending camera position: centered at
      // the target, at zoom level 9, and north up.
      center: coordinates,
      zoom: 9,
      bearing: 0,
       
      // These options control the flight curve, making it move
      // slowly and zoom out almost completely before starting
      // to pan.
      speed: 1, // flying speed
      curve: 1, // change the speed at which it zooms out
       
      // This can be any easing function: it takes a number between
      // 0 and 1 and returns another number between 0 and 1.
      easing: function(t) {
      return t;
      },
       
      // this animation is considered essential with respect to prefers-reduced-motion
      essential: true
      });
  }

  /*
   * Called to make a popup with a label appear for a given point.
   */
  function showLabel(point: IPoint) {
    if (point.showLabel) return;
    const state = getState(point);
    if (!state) return;
    const color = state.color;
    point.selectedPopup = new mapboxgl.Popup({
      offset: [-10, 0],
      anchor: 'center',
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(point.feature.geometry.coordinates)
      .setHTML(`<h4 style='color: ${color}'>${point.feature.properties.place}</h4>`).addTo(map);
    point.showLabel = true;
    point.selected = true;
  }

  /*
   * Called to hide a point's label.
   */
  function hideLabel(point: IPoint) {
    if (point.selectedPopup) {
      point.selectedPopup.remove();
      point.selectedPopup = null;
    }
    point.wasHovered = false;
    point.showLabel = false;
    point.selected = false;
  }

  /* Returns the corresponding state of a point */
  function getState(point: IPoint): IState {
    return find(stateElements, e => e.name === point.feature.properties['GTE_States_18thcentury state']);
  }

  /* This function theoretically exists in MapBox but it kept failing. */
  function contains(outer, inner) {
    let lng = inner[0];
    let lat = inner[1];
    return outer.getWest() <= lng && lng <= outer.getEast() && outer.getSouth() <= lat && lat <= outer.getNorth();
  }

  /* When passed an array of arrays of points, those points' labels are shown */
  function showAllLabels(classes) {
    classes.forEach((pts) => {
      pts.forEach((pt) => {
        if (contains(map.getBounds(), pt.feature.geometry.coordinates)) {
          showLabel(pt);
        }
      })
    })
  }

  /* When passed an array of arrays of points, those points' labels are hidden */
  function hideAllLabels(classes) {
    classes.forEach((pts) => {
      pts.forEach((pt) => {
        if (contains(map.getBounds(), pt.feature.geometry.coordinates)) {
          hideLabel(pt);
        }
      })
    })
  }

  /*
   * Triggers once map is ready to be interacted with.
   */
  map.once('load', function () {
    // map.on('mouseover', 'mytileset-2bl2sr', function (e) {
    //   if (!e.features || !e.features.length) return;
    //   map.getCanvas().style.cursor = 'pointer';
    //   let point = getPoint(e.features[0]);
    //   if (!point) return;
    //   if (!point.showLabel) { // will not reveal hoverPopup for already selected points (which have popups)
    //     point.wasHovered = true;
    //     showLabel(point);
    //   }

    //   // Hide hover labels from other points.
    //   points.filter(point => (point.feature.properties.place !== e.features[0].properties.place) &&
    //     point.wasHovered &&
    //     point.showLabel
    //   ).forEach(point => {
    //     hideLabel(point);
    //   });
    // });

    // hovering off point hides hover popup
    // map.on('mouseout', 'mytileset-2bl2sr', function (e) {
    //   map.getCanvas().style.cursor = '';
    //   for (let point of points) {
    //     if (point.showLabel && point.wasHovered) {
    //       hideLabel(point);
    //     }
    //   }
    // });

    points = map.queryRenderedFeatures({ layers: ['mytileset-2bl2sr'] /* lowercase t */ }).map(e => ({
      feature: e
    }));;
    /* Points ranked by popularity among travelers */
    var class1 = points.filter(point => point.feature.properties['cc_class'] === 1);
    var class2 = points.filter(point => point.feature.properties['cc_class'] === 2);
    var class3 = points.filter(point => point.feature.properties['cc_class'] === 3);
    var class4 = points.filter(point => point.feature.properties['cc_class'] === 4);
    var class5 = points.filter(point => point.feature.properties['cc_class'] === 5);
    var class6 = points.filter(point => point.feature.properties['cc_class'] === 6);

    // only class 1 shows at start
    showAllLabels([class1]);

    map.on('zoom', function() {
      let zoom = map.getZoom();
      let show = []
      let hide = []

      if (zoom >= 9.1) {
        show = [class6, class5, class4, class3, class2, class1]; // reverse order displays most important on top
      } else if (zoom >= 8.0) {
        show = [class5, class4, class3, class2, class1];
        hide = [class6];
      } else if (zoom >= 6.9) {
        show = [class4, class3, class2, class1];
        hide = [class5, class6];
      } else if (zoom >= 5.8) {
        show = [class3, class2, class1];
        hide = [class4, class5, class6];
      } else if (zoom >= 4.7) {
        show = [class2, class1];
        hide = [class3, class4, class5, class6];
      } else if (zoom >= 3.6) {
        show = [class1];
        hide = [class2, class3, class4, class5, class6];
      } else {
        hide = [class1, class2, class3, class4, class5, class6];
      }
      showAllLabels(show);
      hideAllLabels(hide);
    });

    /* Creates legend */
    stateElements.forEach(stateElement => {
      let button = document.createElement('div');
      let color = document.createElement('div');
      let name = document.createElement('p');

      color.setAttribute("class", "stateColor");
      color.style.backgroundColor = stateElement.color;

      name.setAttribute("class", "stateName");
      name.innerHTML = stateElement.name;

      button.setAttribute("class", "stateButton")

      button.appendChild(color);
      button.appendChild(name);
      button.setAttribute("class", "stateButton")

      let buttonWrapper = document.createElement('span')
      buttonWrapper.appendChild(button)
      states.appendChild(buttonWrapper);
    });
  });
}
export default init;