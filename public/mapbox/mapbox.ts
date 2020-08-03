import mapboxgl from "mapbox-gl";
import { find } from "lodash";
/*
  This script provides the functionality for the Map Visualization, which appears within visualization.component.ts. Places of the Grand Tour
  are drawn as features (i.e., points) according to information based from Mapbox and can be selected individually or by state using buttons.
*/

interface IFeature {
  id: Number,
  layer: any,
  properties: {
    "18thcentury state": string,
    "COORDINATE NOTES": string,
    "COORDINATE SOURCE": string,
    "COUNTRY": string,
    "COUNTRY CODE": string,
    "GEONAME ID": string,
    "Italy": string,
    "PLACE": string,
    "REGION": string,
    "WIKIDATA ID": string,
    "complete current name": string,
    "notes": string,
    "place": string,
  },
  source: string,
  sourceLayer: string,
  state: {}
  type: string,
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
    style: require('./styles.json'),
    center: [13, 41],
    zoom: 4.6,
  });

  let points: IPoint[] = [];

  /*
   * Sets up states interaction. Places comprise states, such that every place has a state it belongs to. Clicking a state button will toggle
   * all of its corresponding places.
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

  let popular = new Set();
  popular.add("Bologna");
  popular.add("Florence");
  popular.add("Leghorn");
  popular.add("Milan");
  popular.add("Naples");
  popular.add("Padua");
  popular.add("Rome");
  popular.add("Turin");
  popular.add("Venice");
  

  const search = document.getElementById("searchbar");
  const states = document.getElementById('states');

  search.addEventListener("search", searchMap)

  function searchMap() {
    var rawInput = search.value;
    var input = rawInput.toLowerCase();
    var found = points.filter(point => point.feature.properties['PLACE'].toLowerCase() === input);
    if (found.length < 1) {
      window.alert("Could not find \"" + rawInput + "\".");
      return;
    }
    let location = found[0];
    var coordinates = location.feature.geometry.coordinates;
    showLabel(location);
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
   * Called to select an unselected place. When passed a feature and a place's
   * button, a popup is created at that feature.
   */
  function showLabel(point: IPoint) {
    if (point.showLabel) return;
    const state = getState(point);
    if (!state) return;
    const color = state.color;
    point.selectedPopup = new mapboxgl.Popup({
      offset: [0, -10],
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(point.feature.geometry.coordinates)
      .setHTML(`<h4 style='color: ${color}'>${point.feature.properties.place}</h4>`).addTo(map);
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

  /*
   * When given a state, all of its points are returned.
   */
  function getStatePoints(state) {
    return points.filter(point => point.feature.properties['18thcentury state'] === state.name);
  }

  function getState(point: IPoint): IState {
    return find(stateElements, e => e.name === point.feature.properties['18thcentury state']);
  }

  function setFeatureState(point: IPoint, state) {
    map.setFeatureState({
      source: "composite",
      sourceLayer: "missing_coordinates_GTE_-_final_",
      id: point.feature.id
    }, state);
  }

  function getPoint(feature: IFeature) {
    const point = find(points, e => e.feature.properties.place === feature.properties.place);
    if (!point) {
      console.error("point with place " + feature.properties.place + " not found");
    }
    return point;
  }

  /*
   * Triggers once map is ready to be interacted with. Sets up buttons for each location, allowing one to select and deselect places, 
   * displaying or hiding their popups.
   */
  map.once('load', function () {
    map.on('mouseover', 'missing-coordinates-gte-final', function (e) {
      if (!e.features || !e.features.length) return;
      map.getCanvas().style.cursor = 'pointer';
      let point = getPoint(e.features[0]);
      if (!point) return;
      if (!point.showLabel) { // will not reveal hoverPopup for already selected points (which have popups)
        point.wasHovered = true;
        showLabel(point);
      }

      // Hide hover labels from other points.
      points.filter(point => (point.feature.properties.place !== e.features[0].properties.place) &&
        point.wasHovered &&
        point.showLabel
      ).forEach(point => {
        hideLabel(point);
      });
    });

    // hovering off point hides hover popup
    map.on('mouseout', 'missing-coordinates-gte-final', function (e) {
      map.getCanvas().style.cursor = '';
      for (let point of points) {
        if (point.showLabel && point.wasHovered) {
          hideLabel(point);
        }
      }
    });

    points = map.queryRenderedFeatures({ layers: ['missing-coordinates-gte-final'] }).map(e => ({
      feature: e
    }));
    points.forEach((point) => {
      if (popular.has(point.feature.properties['place'])) {
        showLabel(point);
        //setFeatureState(point, { showLabel: true });
      } else {
        setFeatureState(point, { showLabel: false }); // hide labels
      }
    });

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