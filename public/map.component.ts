/*
 * This file handles the "Map" feature of the website. The Map feature is handled by mapbox.ts.
 */

import d3 from "d3";
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapbox/mapbox.css";
import initMapbox from "./mapbox/mapbox";

function createPopup(id, content?) {
    return `
    <div class="gte-viz-popup-wrapper" (mouseover)="tooltip = '${id}'">
        <p class="hover-item" (mouseover)="tooltip = '${id}'" (mouseleave)="(tooltip === '${id}') && (tooltip = null)">?</p>
        <div class="mentioned-names-popup" (mouseleave)="(tooltip === '${id}') && (tooltip = null)" [ngStyle]="{'margin-left': '15px', 'margin-top': '-30px', display: 'block', opacity: tooltip === '${id}' ? '1': '0', 'z-index': tooltip == '${id}' ? 99: -1, clear: both}">
            ${content || `<div [innerHtml]="getSelectedPopupText('${id}')"></div>`}
        </div>
    </div>`;
}

/*
 * Handles the Map "page", and its HTML and some styles.
 */
@Component({
    selector: 'map',
    template: `

    <div class='container' style='height:100% width:100%'>
        <div class='viz-btn-group' style='margin:10px 0px; display: none'>
            <div id='mapSwitchWrapper' class='switchWrapper'>
                <button id="mapSwitch" class="switch">Map of Travel Places</button>
                <div id='mapDescription' class="description">
                    ${createPopup("map", `
                    <p>This interactive map shows all the locations of places of travel within the Italian peninsula and islands, and their historical political affiliations. Note that you can zoom in for clearer vision.</p>
                    `)}
                </div>
            </div>
        </div>

        <div class='viz-box' id='map-box' width="100%" height="100%">
            <div id="map-container">  
                <div id='map'></div>
                <div class='places-box top'>
                <div class='places-box-inner'>
                    <div id='search'>
                    <input type='search' placeholder="Search..." id='searchbar'>
                    </div>
                </div>
                </div>
                <div class='states-box top'>
                <div class='states-box-inner'>
                    <div id='states'></div>
                </div>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
    .mySvg {
        display: inline-block;
        background-color: white;
        border-top: 1px solid #dddddd;
        border-bottom-right-radius: 2px;
        border-bottom-left-radius: 2px;
    }

    .description {
        display: inline-block;
        position: relative;
        left: 8px;
    }

    .switchWrapper {
        display: inline-block;
        cursor: pointer;
    }
      
    #mapSwitchWrapper {
        border-top-right-radius: 2px;
        border-bottom-right-radius: 2px;
        background-color: #eeeeee;
        color: black;
    }

    .switch {
        background-color: inherit;
    }

    #mapDescription {
        visibility: hidden;
    }

    #color {
        width: 100px;
    }

    #size {
        width: 130px;
    }

    #group {
        width: 150px;
    }

    .popup {
        opacity: 0;
        padding: 9px 14px;
        position: absolute;
        min-width: 225px;
        text-align: left;
        z-index: 99;
    }

    #mapPopup {
        min-width: 325px;
    }

    .mentioned-names-popup p {
        display: inline-block;
        font-size: 12px;
    }

    .popup-wrapper {
        display: inline-block;
        position: relative;
        right: 28px;
    }

    .popup-wrapper[hidden] {
        display: none;
    }

    .popup-wrapper p {
        color: #d0b67d;
    }

    .gte-viz-popup-wrapper {
        position: relative;
        display: inline-block;
    }
    `]
})

/*
 * This class handles the functionality of the map.
 */
export class MapComponent {
    tooltip: string; // "color", "size", or "group"
    color: string;
    size: string;
    group: string;

    constructor(private http: HttpClient) {
        this.group = "none";
        this.size = "none";
        this.color = "none";
        
    }

    ngOnInit() {
        console.log('IM');
        initMapbox();
    }

    getSelectedPopupText(dimension) {
        switch (dimension) {
            case "color":
                return this.getPopupText(this.color);
            case "group":
                return this.getPopupText(this.group);
            case "size":
                return this.getPopupText(this.size);
            default:
                return;
        }
    }

    /*
     * When given the string value of a selected dimension, the ? popup's description is returned.
     */
    getPopupText(value) {
        const texts = {
            "none": "",
            "gender": "Whether we know the travelers as male or female. ",
            "new": "Origin distinguishes between entries extracted from Ingamells’ <span style='font-style: oblique'>Dictionary</span> and additional entries created within the Explorer database. ",
            "length": "Entries containing fifty or less words are all represented as the smallest dot shown, while the rest is sized to scale by word count. ",
            "travelTime": "Tours of six months or less are all represented as the smallest dot shown, while the rest are sized to scale by months spent abroad. ",
            "travel": "For each decade are shown the travelers who set on their tours of Italy during that timeframe. ",
            "tours": "Distribution of travelers according to how many tours of Italy they undertook. "
        }
        return texts[value];
    }

    clear() {
        d3.selectAll("svg > *").remove();
    }

    clicked(event) {
        console.log(event);
    }
}