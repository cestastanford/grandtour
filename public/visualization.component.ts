/*
 * Based on designs by Ashwin Ramaswami and Cody Leff. This file handles the "View" feature of the website. The Dots feature displays entries
 * as dots, allowing one to color, size, and group them according to certain properties. The Map feature will display a map of Italy with
 * locations of tours.
 */

import d3 from "d3";
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
import '@swimlane/ngx-datatable/release/index.css';
import '@swimlane/ngx-datatable/release/themes/material.css';
import '@swimlane/ngx-datatable/release/assets/icons.css';
import { find, values } from "lodash";
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { HttpClient } from '@angular/common/http';

const BUFFER = 5;

/*
 * Handles the View "page", and its HTML and some styles.
 */
@Component({
    selector: 'visualization',
    template: `

    <div class='container' style='height:100% width:100%'>
        <div class='viz-btn-group' style='margin:10px 0px'>
            <button id="dotsSwitch" (click)="switch('dots')">Chart of Travelers</button>
            <button id="mapSwitch" (click)="switch('map')">Map of Travel Places</button>
        </div>

        <div class='viz-box' id='dots-box'>
            <div class='dimension'>
                <p>COLOR</p>
                <select id="color" (change)="update()">
                    <option value="none">None</option>
                    <option value="gender">Gender</option>
                    <option value="new">New entries</option>
                </select>
            </div>
            <div class='dimension'>
                <p>SIZE</p>
                <select id="size" (change)="update()">
                    <option value="none">None</option>
                    <option value="length">Entry length</option>
                    <option value="travelTime">Travel length</option>
                </select>
            </div>
            <div class='dimension'>
                <p>GROUP</p>
                <select id="group" (change)="update()">
                    <option value="none">None</option>
                    <option value="travel">Date of travel</option>
                    <option value="gender">Gender</option>
                    <option value="tours">Number of tours</option>
                </select>
            </div>
            
            <svg width="100%" height="1250px" class="mySvg" id="dotsSvg" (click)="clicked($event)"></svg>
        </div>

        <div class='viz-box' id='map-box' width="100%" height="100%" style="display:none">
            <iframe src="mapbox.html" width="100%" height="600px"></iframe>
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
        var dotSwitch = document.getElementById("dotsSwitch");
        var mapSwitch = document.getElementById("mapSwitch");

        var dotsBox = document.getElementById("dots-box");
        var mapBox = document.getElementById("map-box");

        if (dotSwitch && mapSwitch && dotsBox && mapBox) {
            switch (on) {
                case "dots":
                    dotSwitch.style.backgroundColor = "#dddddd";
                    mapSwitch.style.backgroundColor = "#eeeeee";

                    this.update();
                    
                    dotsBox.style.display = "block";
                    mapBox.style.display = "none";
                    break;
                case "map":
                    dotSwitch.style.backgroundColor = "#eeeeee";
                    mapSwitch.style.backgroundColor = "#dddddd";

                    dotsBox.style.display = "none";
                    mapBox.style.display = "block";
                    break;
                default:
                    return;
            }
        }
        
    }

    /*
     * Called when a select element is changed. All values are collected and the svg is updated.
     */
    update() {
        var colorSelect = document.getElementById("color") as HTMLSelectElement;
        var colorBy = colorSelect.options[colorSelect.selectedIndex].value;

        var sizeSelect = document.getElementById("size") as HTMLSelectElement;
        var sizeBy = sizeSelect.options[sizeSelect.selectedIndex].value;

        var groupSelect = document.getElementById("group") as HTMLSelectElement;
        var groupBy = groupSelect.options[groupSelect.selectedIndex].value;

        this.draw(colorBy, sizeBy, groupBy);
    }

    clear() {
        d3.selectAll("svg > *").remove();
    }


    /*
     * For all groups, their label and dots are displayed.
     */
    async draw(colorBy, sizeBy, groupBy) {
        var allGroups = await this.getGroups(groupBy); // specifies group titles and their queries
        var entryGroups = await this.groupByType(allGroups); // groups entries according to appropriate queries

        this.clear();
        let x = 1;
        let y = 12;
        for (let i in entryGroups) {
            const group = allGroups[i];
            const entriesInGroup = (entryGroups[i] as { entries: any[], request: any }).entries;

            d3.select('svg').append("text")
                .attr("x", x)
                .attr("y", y)
                .text(function (d) { return group.title; });
            y += 15;

            let dotGroup = this.drawDots(entriesInGroup, colorBy, sizeBy, y);
            y = dotGroup + 50;
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
    drawDots(entries, colorBy, sizeBy, y) {
        let x = BUFFER;

        let div = d3.select("body").append("div")
            .attr("class", "tool_tip")
            .style("opacity", 0)
        let width = d3.select("svg")[0][0].clientWidth;

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
                        myColor = "cornflowerblue";
                        break;
                    case "Female":
                        myColor = "indianred";
                        break;
                    default:
                        myColor = "dimgray";
                }
            } else if (colorBy === "new") {
                switch (Number.isInteger(entry.index)) {
                    case true:
                        myColor = "black";
                        break;
                    case false:
                        myColor = "cornflowerblue";
                        break;
                    default:
                        myColor = "dimgray";
                }
            } 

            var mySize;
            if (sizeBy === "length") {
                mySize = Math.max(1, Math.ceil(entry.entryLength * .002));
                // var length = entry.entryLength;
                // if (length < 50) {
                //     mySize = 1;
                // } else if (length < 200) {
                //     mySize = 3;
                // } else if (length < 400) {
                //     mySize = 5;
                // } else if (length < 800) {
                //     mySize = 7;
                // } else {
                //     mySize = 9;
                // }
            } else if (sizeBy === "travelTime") {
                mySize = Math.max(1, Math.ceil(entry.travelTime * .04)); // entries that have no travelTime will have a size of 1
            } else {
                mySize = 3;
            }
            // todo: hover boundary of 2px
            d3.select('svg').append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', mySize)
                .attr('fill', myColor)
                .style("opacity", 0.75)
                // we define "mouseover" handler, here we change tooltip
                // visibility to "visible" and add appropriate test

                .on("mouseover", function (d) {
                    div.transition()
                        .style("opacity", .9)
                    div.text(entry.fullName)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px")
                        .style("opacity", .9)
                    }
                )
                .on("mouseout", function (d) {
                    div.transition()
                        .style("opacity", 0);
                    }
                )
                .on("click", function() {
                    div.style("opacity", 0);
                    var hash = `/#/entries/${entry.index}`;
                    window.open(hash);
                    }
                );
            x += 10;
        }
        return y; // Position for end of the dot group is returned to position next dot group.
    }

    /*
     * Using queries from getGroups, all entries are mapped to the appropriate group and returned.
     */
    private async groupByType(allGroups) {
        let entryGroups;
        try {
            entryGroups = await Promise.all(allGroups.map(group =>
                this.http.post('/api/entries/search', { query: group.query }).toPromise()
            ));
        }
        catch (e) {
            console.error(e);
            alert("There was an error loading the visualization requested.");
            return;
        }
        return entryGroups;
    }

    /*
     * The groupBy value is used to return a mapping of groups and their titles.
     */
    private async getGroups(groupBy) {
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
                    title: "Unknown"
                }
            ],
            "tours": [
                {
                    query: { numTours: "1"},
                    title: "1"
                },
                {
                    query: { numTours: "2"},
                    title: "2"
                },
                {
                    query: { numTours: "3"},
                    title: "3"
                },
                {
                    query: { numTours: "4"},
                    title: "4"
                },
                {
                    query: { numTours: "5"},
                    title: "5"
                },
                {
                    query: { numTours: "6"},
                    title: "6"
                },
                {
                    query: { numTours: "7"},
                    title: "7"
                },
                {
                    query: { numTours: "8"},
                    title: "8"
                },
                {
                    query: { numTours: "9"},
                    title: "9"
                },
                {
                    query: { numTours: "10"},
                    title: "10"
                },
                {
                    query: { numTours: "11"},
                    title: "11"
                },
                {
                    query: { numTours: "13"},
                    title: "13"
                },
                {
                    query: { numTours: "16"},
                    title: "16"
                },
                {
                    query: { numTours: "20"},
                    title: "20"
                },
            ]
        }
        return mapping[groupBy];
    }

    clicked(event) {
        console.log(event);
    }
}