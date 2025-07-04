/*
 * This file handles the "Chart" feature of the website. The Chart feature displays entries as dots, allowing one to color, size, and group 
 * them according to certain properties.
 */

import d3 from "d3";
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const BUFFER = 5;
const LEGEND_DOT_HEIGHT = 12;
const LEGEND_TEXT_HEIGHT = LEGEND_DOT_HEIGHT + 5;

const COLOR_MAIN = "black"
const COLOR_MALE = "#6AA84F";
const COLOR_FEMALE = "#FAB876";
const COLOR_OLD = "#b6bfc6"; // Origin: DBITI Entry
const COLOR_NEW = "#674ea7"; // Origin: Explorer Entry
const COLOR_OTHER = "#333";
const COLOR_QUESTION = "#257DBD";

const SIZE_DEFAULT = 3;

function createPopup(id, content?) {
    return `
    <div class="gte-viz-popup-wrapper" (mouseover)="tooltip = '${id}'">
        <p class="hover-item" (mouseover)="tooltip = '${id}'" (mouseleave)="(tooltip === '${id}') && (tooltip = null)">?</p>
        <div class="mentioned-names-popup right" (mouseleave)="(tooltip === '${id}') && (tooltip = null)" [ngStyle]="{'margin-left': '15px', 'margin-top': '-30px', display: 'block', opacity: tooltip === '${id}' ? '1': '0', 'z-index': tooltip == '${id}' ? 99: -1, clear: both}">
            ${content || `<div [innerHtml]="getSelectedPopupText('${id}')"></div>`}
        </div>
    </div>`;
}

/*
 * Handles the Chart "page", and its HTML and some styles.
 */
@Component({
    selector: 'chart',
    template: `

    <div class='container' style='height:100%; width:100%'>
        <div class='viz-btn-group' style='margin:10px 0px; display: none'>
            <div id='dotsSwitchWrapper' class='switchWrapper'>
                <button id="dotsSwitch" class="switch">Dot Chart of Travelers</button>
            </div>
        </div>

        <div class='viz-box' id='dots-box'>
            <div class='dimension'>
                <p>COLOR</p>
                <select id="color" [(ngModel)]="color" (change)="update()">
                    <option value="none">None</option>
                    <option value="gender">Gender</option> 
                    <option value="new">Origin</option>
                </select>
                <div id="colorPopupWrapper" class="popup-wrapper" [hidden]="color === 'none'">
                    ${createPopup("color")}
                </div>
            </div>
            <div class='dimension'>
                <p>SIZE</p>
                <select id="size" [(ngModel)]="size" (change)="update()">
                    <option value="none">None </option>
                    <option value="length">Word count</option>
                    <option value="travelTime">Travel length</option>
                </select>
                <div id="sizePopupWrapper" class="popup-wrapper" [hidden]="size === 'none'">
                    ${createPopup("size")}
                </div>
            </div>
            <div class='dimension'>
                <p>GROUP</p>
                <select id="group" [(ngModel)]="group" (change)="update()">
                    <option value="none">None </option>
                    <option value="travel">Date of travel</option>
                    <option value="gender">Gender</option>
                    <option value="new">Origin</option>
                    <option value="tours">Number of tours</option>
                </select>
                <div id="groupPopupWrapper" class="popup-wrapper" [hidden]="group === 'none'">
                    ${createPopup("group")}
                </div>
            </div>
            
            <svg width="100%" height="1250px" class="mySvg" id="dotsSvg" (click)="clicked($event)"></svg>
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
      
    #dotsSwitchWrapper {
        background-color: #dddddd;
        color: black;
        border-top-left-radius: 2px;
        border-bottom-left-radius: 2px;
    }

    .switch {
        background-color: inherit;
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

    .mentioned-names-popup p {
        display: inline-block;
        font-size: 12px;
    }

    .mentioned-names-popup.right {
        left:0
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
 * This class handles the functionality of the chart.
 */
export class ChartComponent {
    tooltip: string; // "color", "size", or "group"
    color: string;
    size: string;
    group: string;

    constructor(private http: HttpClient) {
        this.group = "none";
        this.size = "none";
        this.color = "none";
        this.update();
        window.addEventListener("resize", (e: Event) => {
            this.update();
        });
        
    }

    getSelectedPopupText(dimension) {
        switch (dimension) {
            case "color":
                return this.getPopupText(this.color, "color");
            case "group":
                return this.getPopupText(this.group, "group");
            case "size":
                return this.getPopupText(this.size, "size");
            default:
                return;
        }
    }

    /*
     * When given the string value of a selected dimension, the ? popup's description is returned.
     */
    getPopupText(value, dimension) {
        const texts = {
            "none": "",
            "gender": "When known as either female or male, the gender identity of travelers in the database. This is unknown for 1.17% of the travelers.",
            "new": "Origin distinguishes between entries retrieved from the <span style='font-style: oblique'>Dictionary</span> and additional entries created within the Explorer database.",
            "length": "Entries containing fifty or fewer words are represented as a small dot, while the rest are sized to scale by word count.",
            "travelTime": "Tours of six months or less are represented as a small dot, while the rest are sized to scale by months spent abroad.",
            "travel": "Distribution of travelers according to the decade during which they began their tours of Italy.",
            "tours": "Distribution of travelers according to how many tours of Italy they undertook."
        }
        if (value === "gender" && dimension === "group") {
            return "Distribution of travelers according to their identification in the database as male or female.";
        }
        return texts[value];
    }

    /*
     * Called when a select element is changed. All values are collected and the svg is updated.
     */
    update() {
        this.draw(this.color, this.size, this.group);
    }

    clear() {
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
            
            if (group.title == "DBITI Entry") {
                d3.select('svg').append("text")
                    .attr("x", x)
                    .attr("y", y)            
                    .style("font-style", "oblique")
                    .text("DBITI");
                d3.select('svg').append("text")
                    .attr("x", x + 38)
                    .attr("y", y)
                    .text("Entry")
                    .style("font-style", "normal");
            } else {
                d3.select('svg').append("text")
                    .attr("x", x)
                    .attr("y", y)
                    .text(function (d) { return group.title; });
            }
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
                .text("Not available");
            // label will specify what information is unknown based on dot attributes
            if (sizeBy === "travelTime") {
                d3.select('svg').append("text")
                    .attr("x", x += 89)
                    .attr("y", y)
                    .text("travel length");
                if (groupBy === "travel") {
                    d3.select('svg').append("text")
                        .attr("x", x += 89)
                        .attr("y", y)
                        .text("and date of travel");
                } else if (groupBy === "tours") {
                    d3.select('svg').append("text")
                        .attr("x", x += 89)
                        .attr("y", y)
                        .text("and number of tours");
                }
            } else if (groupBy === "travel") {
                d3.select('svg').append("text")
                    .attr("x", x += 89)
                    .attr("y", y)
                    .text("travel length");
            } else if (groupBy === "tours") {
                d3.select('svg').append("text")
                    .attr("x", x += 89)
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
            .style("opacity", 0);
        const svg = d3.select("svg")[0][0];
        if (!svg) return;
        let width = svg.clientWidth;

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
                    var hash = `/explorer/#/entries/${zEntry.index}`;
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
                this.http.post('/explorer/api/entries/search', { query: group.query }).toPromise()
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
                    title: "Data not available"
                }
            ],
            "new": [
                {
                    query: { index: { $type: "int" } },
                    title: "DBITI Entry"
                },
                {
                    query: { index: { $not: { $type: "int" } } },
                    title: "Explorer Entry"
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
                    .text(specifyGender ? "Gender not available" : "Not available");
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
                    .attr("x", 50)
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