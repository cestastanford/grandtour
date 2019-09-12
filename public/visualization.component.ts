/*
 * Based on designs by Ashwin Ramaswami and Cody Leff. This file handles the "View" feature of the website. The Travelers feature displays entries
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
const LEGEND_DOT_HEIGHT = 12;
const LEGEND_TEXT_HEIGHT = LEGEND_DOT_HEIGHT + 5;

const COLOR_MAIN = "black"
const COLOR_MALE = "#6D808E";
const COLOR_FEMALE = "#FAB876";
const COLOR_OLD = "#6D808E";
const COLOR_NEW = "#AC7BCD";
const COLOR_OTHER = "black";
const COLOR_QUESTION = "#257DBD";

const SIZE_DEFAULT = 3;


/*
 * Handles the View "page", and its HTML and some styles.
 */
@Component({
    selector: 'visualization',
    template: `

    <div class='container' style='height: 100%'>
        <div class='viz-btn-group' style='margin:10px 0px'>
            <button>Travelers</button>
            <button>Map</button>
        </div>

        <div class='viz-box'>
            <div class='dimension'>
                <p>COLOR</p>
                <select id="color" (change)="update()">
                    <option value="none">None</option>
                    <option value="gender">Gender</option>
                    <option value="new">Origin</option>
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
            <p style='font-family: serif; font-size: 11pt; display: inline-block; padding: 0px 8px'>Each dot represents a traveler and all 6005 travelers are represented...</p>
            <svg width="100%" height="1250px" id="mySvg" (click)="clicked($event)"></svg>
        </div>
    </div>
    `,
    styles: [`
    #mySvg {
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
        let y = groupBy == "none" || colorBy == "none" ? 15 : 30;

        if (colorBy !== "none") {
            this.drawLegend(colorBy);
        }
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
        var svg = document.getElementById("mySvg");
        if (svg) {
            svg.setAttribute("height", String(y - 15));
            svg.setAttribute("width", "100%");
        }
    }

    /*
     * When dots are colored, legend is printed at top.
     */
    drawLegend(colorBy) {
        let div = d3.select("body").append("div")
            .attr("class", "tool_tip")
            .style("border-radius", 0)
            .style("background-color", "white")
            .style("box-shadow", "0 2px 10px #ccc")
            .style("opacity", 0)
            .style("padding", "5px")
            .style("font-family", "serif")
            .style("text-size", "10pt")
            .style("width", "25%");
        switch (colorBy) {
            case "gender":
                d3.select('svg').append('circle')
                    .attr('cx', 5)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_MALE)
                    .style("opacity", 0.75)
                d3.select('svg').append("text")
                    .attr("x", 12)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Male");
                d3.select('svg').append('circle')
                    .attr('cx', 65)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_FEMALE)
                    .style("opacity", 0.75)
                d3.select('svg').append("text")
                    .attr("x", 72)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Female");
                d3.select('svg').append('circle')
                    .attr('cx', 145)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_OTHER)
                    .style("opacity", 0.75)
                d3.select('svg').append("text")
                    .attr("x", 152)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Unknown");
                d3.select('svg').append("text")
                    .attr("x", 222)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .attr("font-weight", 700)
                    .attr("fill", COLOR_QUESTION)
                    .text("?")
                    .on("mouseover", function (d) {
                        div.style("height", "40px")
                        div.transition()
                            .style("opacity", 1);
                        div.text("Gender is a category we attributed and is not always available...")
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px")
                            .style("opacity", 1)
                        }
                    )
                    .on("mouseout", function (d) {
                        div.transition()
                            .style("opacity", 0);
                        }
                    );
                break;
            case "new":
                d3.select('svg').append('circle')
                    .attr('cx', 5)
                    .attr('cy', LEGEND_DOT_HEIGHT)
                    .attr('r', SIZE_DEFAULT)
                    .attr('fill', COLOR_OLD)
                    .style("opacity", 0.75)
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
                    .style("opacity", 0.75);
                d3.select('svg').append("text")
                    .attr("x", 112)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .text("Explorer Entry");
                d3.select('svg').append("text")
                    .attr("x", 222)
                    .attr("y", LEGEND_TEXT_HEIGHT)
                    .attr("font-weight", 700)
                    .attr("fill", COLOR_QUESTION)
                    .text("?")
                    .on("mouseover", function (d) {
                        div.style("height", "65px")
                        div.transition()
                            .style("opacity", 1)
                        div.text("Origin distinguishes between entries extracted from Ingamells' Dictionary (")
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px")
                            .style("opacity", 1)
                            .append("text")
                                .style("font-style", "oblique")
                                .text("DBITI")
                            .append("text")
                                .text(") and additional entries created in the Explorer database")
                                .style("font-style", "normal")
                        }
                    )
                    .on("mouseout", function (d) {
                        div.transition()
                            .style("opacity", 0);
                        }
                    );
                break;
            default:
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

        let zEntries = [] as any; // entries sorted by z-index

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

            var mySize;
            if (sizeBy === "length") {
                mySize = Math.max(1, Math.ceil(entry.entryLength * .02)); // about half of dots (count < 50) will be the minimum size
            } else if (sizeBy === "travelTime") {
                mySize = Math.max(1, Math.ceil(entry.travelTime * 0.000000000054)); // dots with length < 7 months will be minimum size
            } else {
                mySize = SIZE_DEFAULT;
            }

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
            // todo: hover boundary of 2px
            d3.select('svg').append('circle')
                .attr('cx', zEntry.cx)
                .attr('cy', zEntry.cy)
                .attr('r', zEntry.r)
                .attr('fill', zEntry.fill)
                .style("opacity", sizeBy === "none" ? 0.75 : 0.65)
                // we define "mouseover" handler, here we change tooltip
                // visibility to "visible" and add appropriate test

                .on("mouseover", function (d) {
                    div.transition()
                        .style("opacity", .9)
                    div.text(zEntry.fullName)
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
                {
                    query: { numTours: 9},
                    title: "9"
                },
                {
                    query: { numTours: 10},
                    title: "10"
                },
                {
                    query: { numTours: 11},
                    title: "11"
                },
                {
                    query: { numTours: 13},
                    title: "13"
                },
                {
                    query: { numTours: 16},
                    title: "16"
                },
                {
                    query: { numTours: 20},
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