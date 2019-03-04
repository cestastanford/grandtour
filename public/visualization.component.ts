import d3 from "d3";
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
import '@swimlane/ngx-datatable/release/index.css';
import '@swimlane/ngx-datatable/release/themes/material.css';
import '@swimlane/ngx-datatable/release/assets/icons.css';
import { find, values } from "lodash";
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'visualization',
    template: `
    <style>

    /* Loading from https://codepen.io/anon/pen/Oqywqy */

    .loader {
        width: 60px;
      }
      
      .loader-wheel {
        animation: spin 1s infinite linear;
        border: 2px solid rgba(30, 30, 30, 0.5);
        border-left: 4px solid #fff;
        border-radius: 50%;
        height: 50px;
        margin-bottom: 10px;
        width: 50px;
        position: absolute;
        top: 50vh;
        left: 50vw;
        transform: translateX(-50%) translateY(-50%);
      }
      
      .loader-text {
        color: #fff;
        font-family: arial, sans-serif;
      }
      
      .loader-text:after {
        content: 'Loading';
        animation: load 2s linear infinite;
      }
      
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
      @keyframes load {
        0% {
          content: 'Loading';
        }
        33% {
          content: 'Loading.';
        }
        67% {
          content: 'Loading..';
        }
        100% {
          content: 'Loading...';
        }
      }

    </style>
    <div class='loader' [hidden]="loading === false">
        <div class="loader-wheel"></div>
        <div class="loader-text"></div>
    </div>
    <button class='btn' (click)="groupBy('all')">Show all</button>
    <button class='btn' (click)="groupBy('gender')">Group by gender</button>
    <button class='btn' (click)="groupBy('travel')">Group by travel</button>
    <svg width="100%" height="12000" class="mySvg" (click)="clicked($event)">

    </svg>
    `,
    styles: [`
    .mySvg{
        background-color: #eee;
    }


    `]
})
export class VisualizationComponent {
    loading = false;

    constructor(private http: HttpClient) {
        this.groupBy("all");
    }
    clear() {
        d3.selectAll("svg > *").remove();
    }

    private drawDots(entries, { x = 0, y = 10, random = false } = {}) {
        let div = d3.select("body").append("div")
            .attr("class", "tool_tip")
            .style("opacity", 0);
        let i = 0;
        let width = d3.select("svg")[0][0].clientWidth;
        for (let i in entries) {
            let entry = entries[i];
            if (random) {
                x += Math.random() * 10 + 10;
            }
            else {
                x += 10;
            }
            if (x > width) {
                x = 0;
                y += 10;
            }
            // todo: hover boundary of 2px
            const circle = d3.select('svg').append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 1)
                .attr('fill', 'grey')
                // we define "mouseover" handler, here we change tooltip
                // visibility to "visible" and add appropriate test

                .on("mouseover", function (d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html(entry.fullName)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function (d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        }
        d3.select('svg').selectAll('circle').transition().attr('r', 3).duration(1000);
        return { x, y };
    }

    private async groupByType(queryOptions) {
        this.clear();
        this.loading = true;
        let entriesList;
        try {
            entriesList = await Promise.all(queryOptions.map(queryOption =>
                this.http.post('/api/entries/search', { query: queryOption.query }).toPromise()
            ));
        }
        catch (e) {
            console.error(e);
            this.loading = false;
            alert("There was an error loading the visualization requested.");
        }
        let x = 0;
        let y = 10;
        for (let i in entriesList) {
            const response = entriesList[i];
            const queryOption = queryOptions[i];
            d3.select('svg').append("text")
                .attr("x", 0)
                .attr("y", y)
                .text(function (d) { return queryOption.title; });
            y += 20;
            let result = this.drawDots((response as { entries: any[], request: any }).entries, { x, y, random: queryOption.random || false });
            x = 0;
            y = result.y + 50;
        }
        this.loading = false;
    }

    ngAfterContentInit() {
        d3.select('p').style('color', 'red');
        // d3.select('svg').append('circle').attr('cx', 0).attr('cy', 0).attr('r', 20).attr('fill', 'red');
    }

    groupBy(type) {
        const mapping = {
            "all": [
                { title: "", random: true, query: {} }
            ],
            "gender": [
                {
                    query: { type: "Man" },
                    title: "Man"
                },
                {
                    query: { type: "Woman" },
                    title: "Woman"
                }
            ],
            "travel": [
                {
                    query: { travelDate: { startYear: "0", endYear: "1699" } },
                    title: "Before 1700"
                },
                {
                    query: { travelDate: { startYear: "1700", endYear: "1720" } },
                    title: "1700-1720"
                },
                {
                    query: { travelDate: { startYear: "1721", endYear: "1740" } },
                    title: "1721-1740"
                },
                {
                    query: { travelDate: { startYear: "1741", endYear: "1760" } },
                    title: "1744-1760"
                },
                {
                    query: { travelDate: { startYear: "1761", endYear: "9999" } },
                    title: "1761+"
                }
            ]
        }
        this.groupByType(mapping[type]);
    }
}