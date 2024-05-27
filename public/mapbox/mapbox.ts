import mapboxgl from "mapbox-gl";
import { find } from "lodash";
/*
  This script provides the functionality for the Map Visualization, which appears within map.component.ts. Places of the Grand Tour
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
  borderColor?: string, 
  borderWidth?: string,
  buttonElement?: HTMLDivElement,
  selected?: boolean
}

function init() {
  // sets up map
  const bounds = [
    // [97.99607693081663, 60.84720739645755], // Southwest coordinates
    // [-22.48332558447902, 13.414923834233377] // Northeast coordinates
    [-20, 15],
    [90, 62]
  ];
  mapboxgl.accessToken = 'pk.eyJ1IjoicnlhbmN0YW4iLCJhIjoiY2p6cmZpb3c1MGtweTNkbjR2dGRrMHk5ZiJ9.H8nXUqRjABlGumy-D8fA7A'; // replace this with your access token
  let map = new mapboxgl.Map({
    container: 'map',
    style: require('./style.json'),
    center: [13, 41],
    zoom: 4.6,
    maxBounds: bounds
  });

  console.log('init');

  let points: IPoint[] = [];

  /*
   * Sets up states interaction. Places comprise states, such that every place has a state it belongs to. Clicking a state button will toggle
   * all of its corresponding places.
   */
  let stateElements: IState[] = [
    { name: 'Papal States', color: '#B376B4' },
    { name: 'Grand Duchy of Tuscany', color: '#6DDA8B' },
    { name: 'Duchy of Modena, Massa and Carrara', color: '#DBBB66' },
    { name: 'Republic of Venice', color: '#EE8202' },
    { name: 'Duchy of Milan and Mantua', color: '#7FB8DA' },
    { name: 'Bishopric of Trento', color: '#8A6B63' },
    { name: 'Kingdom of Naples', color: '#0E619C' },
    { name: 'House of Savoy/Kingdom of Sardinia', color: '#A37E1A' },
    { name: 'Republic of Lucca', color: '#4D852F' },
    { name: 'Duchy of Parma and Piacenza', color: '#7125BD' },
    { name: 'Republic of Genoa', color: '#D85B5B' },
    { name: 'Duchy of Sora', color: '#ebb734', borderColor:"##f20505", borderWidth: "2px" },
    { name: 'Republic of San Marino', color: '#D85B5B', borderColor:"#7F2257", borderWidth: "2px"},
    { name: 'Tyrol', color: '#E855D0' },
    { name: 'Beyond Italy', color: '#ffffff', borderColor: '#0000000' },
  ];

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

  const filteredOutLocations = new Set<string>(['Italy' , 'Sicily', 'northern Italy']);

  /*
   * Called to select an unselected place. When passed a feature and a place's
   * button, a popup is created at that feature.
   */
  function showLabel(point: IPoint) {
    if (point.showLabel || filteredOutLocations.has(point.feature.properties.place)) return;
    const state = getState(point);
    if (!state) return;
    point.selectedPopup = new mapboxgl.Popup({
      offset: [-10, 0],
      anchor: 'center',
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(point.feature.geometry.coordinates)
      .setHTML(`<a href="explorer/#/explore/%7B%22travelPlace%22:%7B%22operator%22:%22and%22,%22uniques%22:%5B%7B%22_id%22:%22${point.feature.properties.place}%22%7D%5D%7D%7D" target="_blank"><h4>${point.feature.properties.place}</h4></a>`).addTo(map);
    point.showLabel = true;
    point.selected = true;
  }

  /*
   * Called to deselect a selected place. When passed its button, the button is relocated and the popup is removed.
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

  function getState(point: IPoint): IState {
    return find(stateElements, e => e.name === point.feature.properties['GTE_States_18thcentury state']);
  }

  /* This function theoretically exists in MapBox but it kept failing. */
  function contains(outer, inner) {
    let lng = inner[0];
    let lat = inner[1];
    return outer.getWest() <= lng && lng <= outer.getEast() && outer.getSouth() <= lat && lat <= outer.getNorth();
  }

  function showAllLabels(classes) {
    classes.forEach((pts) => {
      pts.forEach((pt) => {
        if (contains(map.getBounds(), pt.feature.geometry.coordinates)) {
          showLabel(pt);
        }
      })
    })
  }

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

    stateElements.forEach(stateElement => {
      let button = document.createElement('div');
      let color = document.createElement('div');
      let name = document.createElement('p');

      color.setAttribute("class", "stateColor");
      color.style.backgroundColor = stateElement.color;
      color.style.borderWidth = stateElement.borderWidth ? stateElement.borderWidth : '1px';
      color.style.borderStyle = 'solid';
      color.style.borderColor = stateElement.borderColor ? stateElement.borderColor : stateElement.color;

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
