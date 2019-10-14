/*
 * This file handles the "View" feature of the website. The Travelers feature displays entries as dots, allowing one to color, size, and group 
 * them according to certain properties. The Map feature is handled by mapbox.html.
 */

import d3 from "d3";
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapbox/mapbox.css";
import initMapbox from "./mapbox/mapbox";

const BUFFER = 5;
const LEGEND_DOT_HEIGHT = 12;
const LEGEND_TEXT_HEIGHT = LEGEND_DOT_HEIGHT + 5;

const COLOR_MAIN = "black"
const COLOR_MALE = "#6D808E";
const COLOR_FEMALE = "#FAB876";
const COLOR_OLD = "#6D808E";
const COLOR_NEW = "#A47FC8";
const COLOR_OTHER = "#333";
const COLOR_QUESTION = "#257DBD";

const SIZE_DEFAULT = 3;

/*
 * Handles the View "page", and its HTML and some styles.
 */
@Component({
    selector: 'visualization',
    template: `

    <div class='container' style='height:100% width:100%'>
        <div class='viz-btn-group' style='margin:10px 0px'>
            <div id='dotsSwitchWrapper' class='switchWrapper' (click)="switch('dots')">
                <button id="dotsSwitch" class="switch">Dot Chart of Travelers</button>
                <div id='dotsDescription' class="description">
                    <p class="hover-item" (mouseover)="showPopup('dotsPopup')" (mouseout)="hidePopup('dotsPopup')">?</p>
                    <div class="tool_tip popup" id="dotsPopup">
                        <p>In this interactive chart every dot represents a traveler all 6005 travelers are represented. If you hover on a dot, the name of that traveler will appear, and if you click on it you will get to that traveler’s entry. You can color, size and group the dots according to the various categories shown as options here below. <span class="hover-item">Learn more...</span></p>
                    </div>
                </div>
            </div>
            <div id='mapSwitchWrapper' class='switchWrapper' (click)="switch('map')">
                <button id="mapSwitch" class="switch">Map of Travel Places</button>
                <div id='mapDescription' class="description">
                    <p class="hover-item" (mouseover)="showPopup('mapPopup')" (mouseout)="hidePopup('mapPopup')">?</p>
                    <div class="tool_tip popup" id="mapPopup">
                        <p>This interactive map shows all the locations of places of travel within the Italian peninsula and islands, and their historical political affiliations. Note that you can zoom in for clearer vision. <span class="hover-item">Learn more...</span></p>
                    </div>
                </div>
            </div>
        </div>

        <div class='viz-box' id='dots-box'>
            <div class='dimension'>
                <p>COLOR</p>
                <select id="color" (change)="update()">
                    <option value="none">None</option>
                    <option value="gender">Gender</option> 
                    <option value="new">Origin</option>
                </select>
                <div id="colorPopupWrapper" class="popup-wrapper">
                    <p class="hover-item" (mouseover)="showPopup('colorPopup')" (mouseout)="hidePopup('colorPopup')">?</p>
                    <div class="tool_tip popup" id="colorPopup">
                        <p></p>
                        <span class="hover-item"> Learn more...</span>
                    </div>
                </div>
            </div>
            <div class='dimension'>
                <p>SIZE</p>
                <select id="size" (change)="update()">
                    <option value="none">None </option>
                    <option value="length">Word count</option>
                    <option value="travelTime">Travel length</option>
                </select>
                <div id="sizePopupWrapper" class="popup-wrapper">
                    <p class="hover-item" (mouseover)="showPopup('sizePopup')" (mouseout)="hidePopup('sizePopup')">?</p>
                    <div class="tool_tip popup" id="sizePopup">
                        <p></p>
                        <span class="hover-item"> Learn more...</span>
                    </div>
                </div>
            </div>
            <div class='dimension'>
                <p>GROUP</p>
                <select id="group" (change)="update()">
                    <option value="none">None </option>
                    <option value="travel">Date of travel</option>
                    <option value="gender">Gender</option>
                    <option value="tours">Number of tours</option>
                </select>
                <div id="groupPopupWrapper" class="popup-wrapper">
                    <p class="hover-item" (mouseover)="showPopup('groupPopup')" (mouseout)="hidePopup('groupPopup')">?</p>
                    <div class="tool_tip popup" id="groupPopup">
                        <p></p>
                        <span class="hover-item"> Learn more...</span>
                    </div>
                </div>
            </div>
            
            <svg width="100%" height="1250px" class="mySvg" id="dotsSvg" (click)="clicked($event)"></svg>
        </div>

        <div class='viz-box' id='map-box' width="100%" height="100%" style="display:none">
            <div id="map-container">  
                <div id='map'></div>
                <div class='places-box top'>
                <div class='places-box-inner'>
                    <div id='selected'></div>
                </div>
                </div>
                <div class='states-box top'>
                <div class='states-box-inner'>
                    <div id='states'>
                        <div class='statebutton' id='gte-viz-statebutton-show-all'>
                            <div class='stateColor'></div>
                            <p class='stateName'>Show All</p>
                        </div>
                    </div>
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

    .description p {
        display: inline-block;
        font-family: serif; 
        font-size: 11pt; 
    }

    .switchWrapper {
        display: inline-block;
        cursor: pointer;
    }
      
    #dotsSwitchWrapper {
        background-color: #dddddd;
        color: black;
        border-top-left-radius: 2px;
        border-bottom-left-radius: 2px;
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

    #dotsPopup {
        min-width: 400px;
    }

    #mapPopup {
        min-width: 325px;
    }

    .popup p {
        font: 13px 'Open Sans', sans-serif;	
        display: inline-block;
    }

    .popup-wrapper {
        display: none; /* "None" by default */
        position: relative;
        right: 28px;
    }

    .popup-wrapper p {
        color: #d0b67d;
    }
    `]
})

/*
 * This class handles the functionality of the visualization.
 */
export class VisualizationComponent {

    constructor(private http: HttpClient) {
        this.draw("none", "none", "none"); // on startup, all dots are displayed without any filters
        window.addEventListener("resize", (e: Event) => {
            this.update();
        });
        
    }

    switch(on) {
        var dotsSwitchWrapper = document.getElementById("dotsSwitchWrapper");
        var mapSwitchWrapper = document.getElementById("mapSwitchWrapper");
        
        var dotsDescription = document.getElementById("dotsDescription");
        var mapDescription = document.getElementById("mapDescription");
        
        var dotsBox = document.getElementById("dots-box");
        var mapBox = document.getElementById("map-box");

        if (dotsSwitchWrapper && mapSwitchWrapper && dotsBox && mapBox) {
            switch (on) {
                case "dots":
                    dotsSwitchWrapper.style.backgroundColor = "#dddddd";
                    mapSwitchWrapper.style.backgroundColor = "#eeeeee";
                    
                    dotsDescription.style.visibility = "visible";
                    mapDescription.style.visibility = "hidden";
                    
                    this.update();
                    
                    dotsBox.style.display = "block";
                    mapBox.style.display = "none";
                    break;
                case "map":
                    dotsSwitchWrapper.style.backgroundColor = "#eeeeee";
                    mapSwitchWrapper.style.backgroundColor = "#dddddd";
                    
                    dotsDescription.style.visibility = "hidden";
                    mapDescription.style.visibility = "visible";
                    
                    dotsBox.style.display = "none";
                    mapBox.style.display = "block";

                    initMapbox();
                    break;
                default:
                    return;
            }
        }
        
    }

    /*
     * When passed a popup element's id as a string, that popup is revealed.
     */
    showPopup(id) {
        var popup = document.getElementById(id);
        popup.style.transition = "all 0.3s"
        popup.style.opacity = "1";

        var select;
        var value;
        if (id !== "dotsPopup" && id !== "mapPopup") {
            switch (id) {
                case "colorPopup":
                    select = document.getElementById("color") as HTMLSelectElement;
                    value = select.options[select.selectedIndex].value;
                    break;
                case "sizePopup":
                    select = document.getElementById("size") as HTMLSelectElement;
                    value = select.options[select.selectedIndex].value;
                    break;
                case "groupPopup":
                    select = document.getElementById("group") as HTMLSelectElement;
                    value = select.options[select.selectedIndex].value;
                    break;
                default:
            }
            let p = popup.firstChild as HTMLParagraphElement;
            p.style.display = "inline";
            p.style.color = "black";
            if (value !== "new") {
                p.innerText = this.getPopupText(value);
            } else {
                p.innerHTML = "Origin distinguishes between entries extracted from Ingamells’ <span style='font-style: oblique'>Dictionary</span> and additional entries created within the Explorer database. "
            }
        }
    }

    /*
     * When given the string value of a selected dimension, the ? popup's description is returned.
     */
    getPopupText(value) {
        const texts = {
            "none": "",
            "gender": "Whether we know the travelers as male or female. ",
            "new": "Origin distinguishes between entries extracted from Ingamells’ Dictionary and additional entries created within the Explorer database. ", // not expected to be called
            "length": "Entries containing fifty or less words are all represented as the smallest dot shown, while the rest is sized to scale by word count. ",
            "travelTime": "Tours of six months or less are all represented as the smallest dot shown, while the rest are sized to scale by months spent abroad. ",
            "travel": "For each decade are shown the travelers who set on their tours of Italy during that timeframe. ",
            "tours": "Distribution of travelers according to how many tours of Italy they undertook. "
        }
        return texts[value];
    }

    /*
     * When passed a popup element's id as a string, that popup is hidden.
     */
    hidePopup(id) {
        var popup = document.getElementById(id);
        popup.style.transition = "all 0.3s"
        popup.style.opacity = "0";
    }

    /*
     * Called when a select element is changed. All values are collected and the svg is updated.
     */
    update() {
        var colorSelect = document.getElementById("color") as HTMLSelectElement;
        var colorBy = colorSelect.options[colorSelect.selectedIndex].value;
        var colorIcon = document.getElementById("colorPopupWrapper");
        if (colorBy === "none") {
            colorIcon.style.display = "none";
        } else {
            colorIcon.style.display = "inline-block";
        }

        var sizeSelect = document.getElementById("size") as HTMLSelectElement;
        var sizeBy = sizeSelect.options[sizeSelect.selectedIndex].value;
        var sizeIcon = document.getElementById("sizePopupWrapper");
        if (sizeBy === "none") {
            sizeIcon.style.display = "none";
        } else {
            sizeIcon.style.display = "inline-block";
        }

        var groupSelect = document.getElementById("group") as HTMLSelectElement;
        var groupBy = groupSelect.options[groupSelect.selectedIndex].value;
        var groupIcon = document.getElementById("groupPopupWrapper");
        if (groupBy === "none") {
            groupIcon.style.display = "none";
        } else {
            groupIcon.style.display = "inline-block";
        }

        this.draw(colorBy, sizeBy, groupBy);
    }

    clear() {
        d3.selectAll("body > div").remove(); // removes remaining tooltips
        d3.selectAll("svg > *").remove();
    }


    /*
     * For all groups, their label and dots are displayed.
     */
    async draw(colorBy, sizeBy, groupBy) {
        var allGroups = await this.getGroups(groupBy, sizeBy); // specifies group titles and their queries
        var entryGroups = await this.groupByType(allGroups); // groups entries according to appropriate queries

        this.clear();
        let x = 1;
        let y = 15;
        // label buffers
        if (groupBy !== "none" && colorBy !== "none") {
            y += 25;
        } else if (groupBy !== "none") {
            y += 8;
        } else if (colorBy !== "none") { // legend spacing
            y += 8;
        }

        // Certain entries are "fake", consolidations of multiple individuals. In certain cases, we want them to be in a separate group.
        var separateFakes = false;
        if (sizeBy === "travelTime" || (groupBy === "travel" || groupBy === "tours")) {
            separateFakes = true;
            var fakeEntries = [];
        }        

        for (let i in entryGroups) {
            const group = allGroups[i];
            let entriesInGroup = (entryGroups[i] as { entries: any[], request: any }).entries;

            d3.select('svg').append("text")
                .attr("x", x)
                .attr("y", y)
                .text(function (d) { return group.title; });
            y += 15;

            if (separateFakes) {
                let fakeEntriesInGroup = entriesInGroup.filter(function (d) {
                    return !(d.fullName.includes(" ")) && d.numTours !== 1 && Number.isInteger(d.index);
                });
                
                entriesInGroup = entriesInGroup.filter(function (d) {
                    return fakeEntriesInGroup.indexOf(d) === -1;
                });

                fakeEntries = fakeEntries.concat(fakeEntriesInGroup);
            }

            let dotGroup = this.drawDots(entriesInGroup, colorBy, sizeBy, groupBy, y);
            y = dotGroup + 50;
        }

        let specifyGender = false; // made true if an Unknown group is drawn 
        // after other dot groups are drawn, the separated fake entries are drawn (when applicable)
        if (separateFakes && fakeEntries) {
            specifyGender = true;
            d3.select('svg').append("text")
                .attr("x", x)
                .attr("y", y)
                .text("Unknown");
            // label will specify what information is unknown based on dot attributes
            if (sizeBy === "travelTime") {
                d3.select('svg').append("text")
                    .attr("x", x += 62)
                    .attr("y", y)
                    .text("travel length");
                if (groupBy === "travel") {
                    d3.select('svg').append("text")
                        .attr("x", x += 79)
                        .attr("y", y)
                        .text("and date of travel");
                } else if (groupBy === "tours") {
                    d3.select('svg').append("text")
                        .attr("x", x += 79)
                        .attr("y", y)
                        .text("and number of tours");
                }
            } else if (groupBy === "travel") {
                d3.select('svg').append("text")
                    .attr("x", x += 62)
                    .attr("y", y)
                    .text("travel length");
            } else if (groupBy === "tours") {
                d3.select('svg').append("text")
                    .attr("x", x += 62)
                    .attr("y", y)
                    .text("number of tours");
            }

            y += 15;

            fakeEntries.sort(function (a,b) {
                return (a.fullName).localeCompare(b.fullName);
            });

            // When grouping by "Date of Travel", we want each "Unknown" entry to appear only once
            if (groupBy === "travel") {
                var doubles = [];

                for (let i = 0; i < fakeEntries.length - 1; i++) {
                    if (fakeEntries[i].fullName !== fakeEntries[i + 1].fullName) {
                        doubles = doubles.concat(fakeEntries[i]);
                        doubles = doubles.concat(fakeEntries[i + 1]);
                    }
                }

                var uniques = [];

                uniques = uniques.concat(doubles[0])
                for (let i = 1; i < doubles.length; i += 2) {
                    uniques = uniques.concat(doubles[i]);
                }
                fakeEntries = uniques;
            }

            if (sizeBy === "travelTime") sizeBy = "none";

            y += 15;
            let dotGroup = this.drawDots(fakeEntries, colorBy, sizeBy, groupBy, y);
            y = dotGroup + 50;
        }

        if (colorBy !== "none") {
            this.drawLegend(colorBy, specifyGender);
        }

        var svg = document.getElementById("dotsSvg");
        if (svg != null) {
            svg.setAttribute("height", String(y - 15));
            svg.setAttribute("width", "100%");
        }
    }

    /*
     * When given the entries of a group and how the dots should be sized and colored, dots are drawn accordingly. A y variable is stored to
     * properly locate the next group.
     */
    drawDots(entries, colorBy, sizeBy, groupBy, y) {
        let x = BUFFER;

        let div = d3.select("body").append("div")
            .attr("class", "tool_tip")
            .style("opacity", 0)
        let width = d3.select("svg")[0][0].clientWidth;

        let zEntries = [] as any; // entries sorted by z-index

        // for visibility purposes, coloring by gender and grouping will also group by gender within each group
        if (colorBy == "gender" && groupBy !== "none") {
            entries.sort(function(a,b) {
                let aVal;
                let bVal;

                switch (a.gender) {
                    case "Male": aVal = -1; break;
                    case "Female": aVal = 0; break;
                    default: aVal = 1; // "Unknown"
                }

                switch (b.gender) {
                    case "Male": bVal = -1; break;
                    case "Female": bVal = 0; break;
                    default: bVal = 1;
                }

                return aVal - bVal;
            })
        }

        for (let i in entries) {
            let entry = entries[i];
            if (x > width - BUFFER) {
                x = BUFFER;
                y += 10;
            }

            var myColor;
            if (colorBy === "gender") {
                switch (entry.gender) {
                    case "Male":
                        myColor = COLOR_MALE;
                        break;
                    case "Female":
                        myColor = COLOR_FEMALE;
                        break;
                    default:
                        myColor = COLOR_OTHER;
                }
            } else if (colorBy === "new") {
                switch (Number.isInteger(entry.index)) {
                    case true:
                        myColor = COLOR_OLD;
                        break;
                    case false:
                        myColor = COLOR_NEW;
                        break;
                    default:
                        myColor = COLOR_OTHER;
                }
            } else {
                myColor = COLOR_MAIN;
            }

            var mySize; // sized by AREA, not RADIUS
            if (sizeBy === "length") {
                mySize = Math.max(2, Math.ceil(Math.sqrt(entry.entryLength) * 0.2828)); // about half of dots (count < 50) will be the minimum size
            } else if (sizeBy === "travelTime") {
                mySize = Math.max(2, Math.ceil(Math.sqrt(Math.abs(entry.travelTime)) * 0.00001592628)); // dots with length < 1 year will be minimum size; abs check is for unexpected negative numTours 
            } else {
                mySize = SIZE_DEFAULT;
            }
            if (Number.isNaN(mySize)) console.log(entry.travelTime);

            var zEntry = {
                cx: x,
                cy: y,
                r: mySize,
                fill: myColor,
                fullName: entry.fullName,
                index: entry.index,
            }

            zEntries.push(zEntry as any);

            x += 10;
        }

        // entries are ordered from largest to smallest, such that smaller dots are drawn on top of larger dots.
        zEntries.sort(function(a, b) {
            return b.r - a.r;
        });

        for (let i in zEntries) {
            let zEntry = zEntries[i];
            d3.select('svg').append('circle')
                .attr('cx', zEntry.cx)
                .attr('cy', zEntry.cy)
                .attr('r', zEntry.r)
                .attr('fill', zEntry.fill)
                .style("opacity", function (d) {
                    if (sizeBy === "none") {
                        return 1;
                    } else if (colorBy === "none" && groupBy !== "none") { // grouped black dots are hard to see when sizing
                        return 0.55;
                    }
                    return 0.8;
                })
                .style("cursor", "pointer")

                .on("mouseover", function (d) {
                    d3.select(this)
                        .attr("stroke", zEntry.fill)
                        .attr("stroke-opacity", 1)
                        .attr("stroke-width", 2)
                    div.transition()
                        .style("opacity", 1)
                    div.text(zEntry.fullName)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px")
                    }
                )
                .on("mouseout", function (d) {
                    d3.select(this)
                        .attr("stroke-width", 0)
                    div.transition()
                        .style("opacity", 0);
                    }
                )
                .on("click", function() {
                    div.style("opacity", 0);
                    var hash = `/#/entries/${zEntry.index}`;
                    window.open(hash);
                    }
                );
        }

        return y; // The placement of the lowest dot is returned. This is used to position the next group.
    }

    /*
     * Using queries from getGroups, all entries are mapped to the appropriate group and returned.
     */
    private async groupByType(allGroups) {
        try {
            return await Promise.all(allGroups.map(group =>
                this.http.post('/api/entries/search', { query: group.query }).toPromise()
            ));
        }
        catch (e) {
            console.error(e);
            return;
        }
    }

    /*
     * The groupBy value is used to return a mapping of groups and their titles. sizeBy is passed to properly name the Unknown gender group.
     */
    private async getGroups(groupBy, sizeBy) {
        const mapping = {
            "none": [
                {   
                    random: true, 
                    query: {},
                    title: ""
                }
            ],
            "travel": [
                {
                    query: { travelDate: { startYear: "0", endYear: "1699" } },
                    title: "Before 1700"
                },
                {
                    query: { travelDate: { startYear: "1700", endYear: "1709" } },
                    title: "1700-1709"
                },
                {
                    query: { travelDate: { startYear: "1710", endYear: "1719" } },
                    title: "1710-1719"
                },
                {
                    query: { travelDate: { startYear: "1720", endYear: "1729" } },
                    title: "1720-1729"
                },
                {
                    query: { travelDate: { startYear: "1730", endYear: "1739" } },
                    title: "1730-1739"
                },
                {
                    query: { travelDate: { startYear: "1740", endYear: "1749" } },
                    title: "1740-1749"
                },
                {
                    query: { travelDate: { startYear: "1750", endYear: "1759" } },
                    title: "1750-1759"
                },
                {
                    query: { travelDate: { startYear: "1760", endYear: "1769" } },
                    title: "1760-1769"
                },
                {
                    query: { travelDate: { startYear: "1770", endYear: "1779" } },
                    title: "1770-1779"
                },
                {
                    query: { travelDate: { startYear: "1780", endYear: "1789" } },
                    title: "1780-1789"
                },
                {
                    query: { travelDate: { startYear: "1790", endYear: "1799" } },
                    title: "1790-1799"
                },
                {
                    query: { travelDate: { startYear: "1800", endYear: "9999" } },
                    title: "1800 and after"
                }
            ],
            "gender": [
                {
                    query: { type: "Male" },
                    title: "Male"
                },
                {
                    query: { type: "Female" },
                    title: "Female"
                },
                {
                    query: { type: "" },
                    title: sizeBy === "travelTime" ? "Unknown gender" : "Unknown"
                }
            ],
            "tours": [
                {
                    query: { numTours: 1},
                    title: "1"
                },
                {
                    query: { numTours: 2},
                    title: "2"
                },
                {
                    query: { numTours: 3},
                    title: "3"
                },
                {
                    query: { numTours: 4},
                    title: "4"
                },
                {
                    query: { numTours: 5},
                    title: "5"
                },
                {
                    query: { numTours: 6},
                    title: "6"
                },
                {
                    query: { numTours: 7},
                    title: "7"
                },
                {
                    query: { numTours: 8},
                    title: "8"
                },
            ]
        }
        return mapping[groupBy];
    }

    /*
     * When dots are colored, legend is printed at top. If an unknown group is present, then gender's "Unknown" label is changed to "Gender unknown"
     */
    drawLegend(colorBy, specifyGender) {
        switch (colorBy) {
            case "gender":
                d3.select('svg').append('circle')
                    .attr('cx', 5)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_MALE)
                d3.select('svg').append("text")
                    .attr("x", 12)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Male");
                d3.select('svg').append('circle')
                    .attr('cx', 65)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_FEMALE)
                d3.select('svg').append("text")
                    .attr("x", 72)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Female");
                d3.select('svg').append('circle')
                    .attr('cx', 145)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_OTHER)
                d3.select('svg').append("text")
                    .attr("x", 152)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text(specifyGender ? "Gender unknown" : "Unknown");
                break;
            case "new":
                d3.select('svg').append('circle')
                    .attr('cx', 5)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_OLD)
                d3.select('svg').append("text")
                    .attr("x", 12)
                    .attr("y", LEGEND_TEXT_HEIGHT)            
                    .style("font-style", "oblique")
                    .text("DBITI")
                d3.select('svg').append("text")
                    .attr("x", 46)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Entry")
                    .style("font-style", "normal")
                d3.select('svg').append('circle')
                    .attr('cx', 105)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_NEW)
                d3.select('svg').append("text")
                    .attr("x", 112)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Explorer Entry");
                break;
            default:
        }
    }

    clicked(event) {
        console.log(event);
    }
}