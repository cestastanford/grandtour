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
  showBlack: boolean,
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

const COLOR_BACKGROUND_STATE_SELECTED = 'rgba(164, 127, 200, 0.5)';
const COLOR_BACKGROUND_STATE_DESELECTED = '#ffffff';

function init() {
  // sets up map
  mapboxgl.accessToken = 'pk.eyJ1IjoicnlhbmN0YW4iLCJhIjoiY2p6cmZpb3c1MGtweTNkbjR2dGRrMHk5ZiJ9.H8nXUqRjABlGumy-D8fA7A'; // replace this with your access token
  let map = new mapboxgl.Map({
    container: 'map',
    style: require('./styles.json'),
    center: [12.5674, 41.8719],
    zoom: 4.8,
    minZoom: 4.8,
    maxBounds: [[-2.5674, 32.8719], [26.5674, 50.8719]]
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

  const stateButtonShowAll = document.getElementById("gte-viz-statebutton-show-all");
  const selected = document.getElementById("selected");
  const states = document.getElementById('states');

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
    if (!point.wasHovered) {
      updatePlaceButtons();
    }
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
    updatePlaceButtons();
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

  /*
   * Called by clicking a state's button. When passed a string of the state's name, all of the state's places are selected.
   */
  function selectState(state: IState) {
    selectBulk(getStatePoints(state));
    state.selected = true;
    state.buttonElement.style.backgroundColor = COLOR_BACKGROUND_STATE_SELECTED;
    updatePlaceButtons();
  }

  /*
   * Called by clicking a state's button. When passed a string of the state's name, all of the state's places are deselected.
   */
  function deselectState(state: IState) {
    deselectBulk(getStatePoints(state));
    state.selected = false;
    state.buttonElement.style.backgroundColor = COLOR_BACKGROUND_STATE_DESELECTED;
  }

  /* Select all points. */
  function selectAll() {
    selectBulk(points);
    stateElements.forEach(e => {
      e.selected = true;
      e.buttonElement.style.backgroundColor = COLOR_BACKGROUND_STATE_SELECTED;
    });
    stateButtonShowAll.style.backgroundColor = COLOR_BACKGROUND_STATE_SELECTED;
  }

  /* Deselect all points. */
  function deselectAll() {
    deselectBulk(points);
    stateElements.forEach(e => {
      e.selected = false;
      e.buttonElement.style.backgroundColor = COLOR_BACKGROUND_STATE_DESELECTED;
    });
    stateButtonShowAll.style.backgroundColor = COLOR_BACKGROUND_STATE_DESELECTED;
  }

  function selectBulk(points_) {
    for (let point of points_) {
      setFeatureState(point, { showBlack: false });
      // The below code shows all labels when a state is selected.
      // if (!point.showLabel) {
      //   showLabel(point, false);
      // }
      point.selected = true;
    }
  }

  function deselectBulk(points_) {
    for (let point of points_) {
      setFeatureState(point, { showBlack: true });
      point.selected = false;
      if (point.showLabel) {
        hideLabel(point);
      }
    }
  }

  function getPoint(feature: IFeature) {
    const point = find(points, e => e.feature.properties.place === feature.properties.place);
    if (!point) {
      console.error("point with place " + feature.properties.place + " not found");
    }
    return point;
  }

  function onPointClick(point: IPoint) {
    if (point.showLabel && point.wasHovered) { // when clicking on a point after hovering over it.
      showLabel(point);
      setFeatureState(point, { showBlack: false });
    } else if (point.showLabel) { // case selected -> deselected
      hideLabel(point);
      setFeatureState(point, { showBlack: true });
    } else { // case deselected -> selected
      showLabel(point);
      setFeatureState(point, { showBlack: false });
    }
    point.wasHovered = false;
  }

  let createCheckbox = (point: IPoint) => `
  <tr><td><div class="checkbox">
    <label>
      <input class="gte-viz-selected-checkbox ${point.selected ? "gte-viz-selected-checkbox-checked" : "gte-viz-selected-checkbox-unchecked"}" type="checkbox" ${point.selected && "checked"} />
      <span>${point.feature.properties.place}</span>
    </label>
  </div></td></tr>`;
  function updatePlaceButtons() {
    const sortFn = (a: IPoint, b: IPoint) => (a.feature.properties.place > b.feature.properties.place) ? 1 : -1;
    let selectedPoints = points.filter(e => e.selected).sort(sortFn);
    let unselectedPoints = points.filter(e => !e.selected).sort(sortFn);
    selected.innerHTML = `<div class="mini-table"><table class="table"><tbody>
      ${selectedPoints.map(createCheckbox).join("\n")}
      ${unselectedPoints.map(createCheckbox).join("\n")}
    </tbody></table></div>`;

    // Add appropriate event listeners.
    document.querySelectorAll("#selected .gte-viz-selected-checkbox-checked").forEach((checkbox, i) => {
      checkbox.addEventListener('change', () => onPointClick(selectedPoints[i]));
    });
    document.querySelectorAll("#selected .gte-viz-selected-checkbox-unchecked").forEach((checkbox, i) => {
      checkbox.addEventListener('change', () => onPointClick(unselectedPoints[i]));
    })
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

    // clicking on point will select/deselect point
    map.on('click', 'missing-coordinates-gte-final', function (e) {
      if (!e.features || !e.features.length) return;
      let point = getPoint(e.features[0]);
      if (!point) return;
      onPointClick(point);
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
      setFeatureState(point, { showBlack: true });
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
      button.style.backgroundColor = "white"; // set here and not in <style>, because it is used to toggle whether the state is selected

      button.appendChild(color);
      button.appendChild(name);

      button.addEventListener('click', function () {
        if (stateElement.selected) {
          deselectState(stateElement);
        } else {
          selectState(stateElement);
        }
      });
      states.appendChild(button);
      stateElement.buttonElement = button;
    });

    stateButtonShowAll.addEventListener('click', function () {
      const allSelected = stateElements.every(e => e.selected);
      if (allSelected) {
        deselectAll();
      } else {
        selectAll();
      }
    });
    updatePlaceButtons();
  });
}
export default init;