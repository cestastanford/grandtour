import mapboxgl from "mapbox-gl";
/*
  This scripta provides the functionality for the Map Visualization, which appears within visualization.component.ts. Places of the Grand Tour
  are drawn as features (i.e., points) according to information based from Mapbox and can be selected individually or by state using buttons.
*/
function init() {
  // sets up map
  mapboxgl.accessToken = 'pk.eyJ1IjoicnlhbmN0YW4iLCJhIjoiY2p6cmZpb3c1MGtweTNkbjR2dGRrMHk5ZiJ9.H8nXUqRjABlGumy-D8fA7A'; // replace this with your access token
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ryanctan/ck0hlxv3h4l5u1co1n3kcs8te', // replace this with your style URL
    center: [12.5674, 41.8719],
    zoom: 4.8,
    minZoom: 4.8,
    maxBounds: [[-2.5674, 32.8719], [26.5674, 50.8719]]
  });

  // sets up hover popup
  var hoverPopup = new mapboxgl.Popup({
    offset: [0, -10],
    closeButton: false,
    closeOnClick: false
  });

  // these divs are the parents of place buttons, which switch depending on if they are selected or not.
  let unselected = document.getElementById('unselected');
  let selected = document.getElementById('selected');
  let selectedPopups = [];
  let states = document.getElementById('states');

  /*
   * When passed the button of a place, that place's corresponding feature is returned.
   */
  function getFeature(placeButton) {
    var points = map.queryRenderedFeatures({ layers: ['missing-coordinates-gte-final'] });
    for (let point of points) {
      if (point.properties.place === placeButton.innerText) {
        return point;
      }
    }
    return;
  }

  /*
   * When passed a place's feature, the button corresponding to that feature is returned.
   */
  function getPlaceButton(feature) {
    if (isSelected(feature)) {
      for (let child of (Array.from(selected.children) as HTMLElement[])) {
        if (feature.properties.place === child.innerText) {
          return child;
        }
      }
    } else {
      for (let child of (Array.from(unselected.children) as HTMLElement[])) {
        if (feature.properties.place === child.innerText) {
          return child;
        }
      }
    }
  }

  /*
   * Called when buttons are initialized or when a popup is created. Re-alphabetizes the children of an HTML element when given the parent 
   * (i.e., either selected or unselected).
   */
  function sortButtons(parent) {
    var children = parent.children;
    [].slice.call(children).sort(function (a, b) {
      return a.textContent.localeCompare(b.textContent);
    }).forEach(function (val, index) {
      parent.appendChild(val);
    });
  }

  /*
   * Called by various functions to see if a popup exists for that point.
   */
  function isSelected(feature) {
    for (let popup of selectedPopups) {
      if (feature.properties.place === popup._content.innerText) {
        return true;
      }
    }
    return false;
  }

  /*
   * Called to select an unselected place. When passed a feature and a place's button, a popup is created at that feature 
   * and added to selectedPopups, and the button is relocated. Expects the feature to not be selected.
   */
  function selectPopup(feature, placeButton) {
    let selectedPopup = new mapboxgl.Popup({ offset: [0, -10], closeButton: false, closeOnClick: false })
      .setLngLat(feature.geometry.coordinates).setHTML('<h4>' + feature.properties.place + '</h4>').addTo(map);
    selectedPopups.push(selectedPopup);
    selected.appendChild(placeButton);
    sortButtons(selected);
    updateStateButton(feature);
  }

  /*
   * Called to deselect a selected place. When passed its button, the button is relocated and the popup is removed.
   */
  function deselectPopup(placeButton) {
    for (let d of selectedPopups) {
      if (d._content.innerText === placeButton.innerText) {
        selectedPopups.splice(selectedPopups.indexOf(d), 1);
        d.remove();
        break;
      }
    };
    unselected.appendChild(placeButton);
    sortButtons(unselected);
    updateStateButton(getFeature(placeButton));
  }

  /*
   * When given a state's name, all of its points are returned.
   */
  function getStatePoints(stateName) {
    var points = map.queryRenderedFeatures({ layers: ['missing-coordinates-gte-final'] });
    return points.filter(function (f) {
      return f.properties['18thcentury state'] === stateName;
    });
  }

  /*
   * Called by clicking a state's button. When passed a string of the state's name, all of the state's places are selected.
   */
  function selectState(stateName) {
    var state = getStatePoints(stateName);
    for (let point of state) {
      if (!isSelected(point)) {
        selectPopup(point, getPlaceButton(point));
      }
    }
  }

  /*
   * Called by clicking a state's button. When passed a string of the state's name, all of the state's places are deselected.
   */
  function deselectState(stateName) {
    var state = getStatePoints(stateName);
    for (let point of state) {
      if (isSelected(point)) {
        deselectPopup(getPlaceButton(point));
      }
    }
  }

  /*
   * When passed a feature that has recently been selected or deselected, the state button is updated to indicate if its state has all of its 
   * features.
   */
  function updateStateButton(feature) {
    var stateName = feature.properties['18thcentury state'];
    let stateButton;
    for (let div of (Array.from(states.children) as HTMLElement[])) {
      if ((div.lastChild as HTMLElement).innerText === stateName) {
        stateButton = div;
        break;
      }
    }

    var state = getStatePoints(stateName);
    var allPointsSelected = true;
    for (let point of state) {
      if (!isSelected(point)) {
        allPointsSelected = false;
        break;
      }
    }

    if (allPointsSelected) {
      stateButton.style.backgroundColor = 'rgba(164, 127, 200, 0.5)';
    } else {
      stateButton.style.backgroundColor = 'white';
    }
  }

  /*
   * Triggers once map is ready to be interacted with. Sets up buttons for each location, allowing one to select and deselect places, 
   * displaying or hiding their popups.
   */
  map.once('load', function () {
    map.on('mouseover', 'missing-coordinates-gte-final', function (e) {
      map.getCanvas().style.cursor = 'pointer';
      let feature = e.features[0];
      if (!isSelected(feature)) { // will not reveal hoverPopup for already selected points (which have popups)
        hoverPopup.setLngLat(e.lngLat)
          .setHTML('<h4>' + feature.properties.place + '</h4>')
          .addTo(map);
      }
    });

    // clicking on point will select/deselect point
    map.on('click', 'missing-coordinates-gte-final', function (e) {
      let feature = e.features[0];
      let button = getPlaceButton(feature)

      if (isSelected(feature)) {
        deselectPopup(button);
      } else { // case deselected -> selected
        hoverPopup.remove();
        selectPopup(feature, button);
      }
    });

    // hovering off point hides hover popup
    map.on('mouseout', 'missing-coordinates-gte-final', function (e) {
      map.getCanvas().style.cursor = '';
      hoverPopup.remove();
    });

    let points = map.queryRenderedFeatures({ layers: ['missing-coordinates-gte-final'] });
    points.forEach(function (f) {
      let placeButton = document.createElement('button');
      placeButton.innerHTML = f.properties.place;
      placeButton.style.display = 'block';

      placeButton.addEventListener('click', function () {
        switch (placeButton.parentElement) {
          case unselected:
            selectPopup(f, placeButton);
            break;
          case selected:
            deselectPopup(placeButton);
            break;
          default:
        }
      })
      // all buttons are initially unselected
      unselected.appendChild(placeButton);
    });
    sortButtons(unselected);
  });

  /*
   * Sets up states interaction. Places comprise states, such that every place has a state it belongs to. Clicking a state button will toggle
   * all of its corresponding places.
   */
  var stateElements = [
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
  ]
  stateElements.forEach(function (element) {
    var button = document.createElement('div');
    var color = document.createElement('div');
    var name = document.createElement('p');

    color.setAttribute("class", "stateColor");
    color.style.backgroundColor = element.color;

    name.setAttribute("class", "stateName");
    name.innerHTML = element.name;

    button.setAttribute("class", "stateButton")
    button.style.backgroundColor = "white"; // set here and not in <style>, because it is used to toggle whether the state is selected

    button.appendChild(color);
    button.appendChild(name);

    button.addEventListener('click', function () {
      if (this.style.backgroundColor === "white") { // state selected -> unselected
        selectState((this.lastChild as HTMLElement).innerHTML);
      } else { // state unselected -> selected
        deselectState((this.lastChild as HTMLElement).innerHTML);
      }
    });
    states.appendChild(button);
  });
}
export default init;