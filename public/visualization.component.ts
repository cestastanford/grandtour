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

    </style>
    <button class='btn' (click)="groupBy('gender')">Group by gender</button>
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
    title = 'app';


    radius = 10;

    constructor(private http: HttpClient) {
        this.http.post('/api/entries/search', { query: {} }).toPromise().then((e: any) => {
            let entries = e.entries;
            let { x, y } = this.drawDots(entries, {random: true});
        })
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
            d3.select('svg').append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', 'grey')
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
        return { x, y };
    }

    private async groupByType(queries) {
        this.clear();
        let entriesList = await Promise.all(queries.map(query =>
            this.http.post('/api/entries/search', { query: query.query }).toPromise()
        ));
        let x = 0;
        let y = 10;
        for (let i in entriesList) {
            const response = entriesList[i];
            d3.select('svg').append("text")
                .attr("x", 0)
                .attr("y", y)
                .text(function (d) { return queries[i].title; });
            y += 20;
            let result = this.drawDots((response as { entries: any[], request: any }).entries, { x, y, random: false });
            x = 0;
            y = result.y + 50;
        }
    }

    ngAfterContentInit() {
        d3.select('p').style('color', 'red');
        // d3.select('svg').append('circle').attr('cx', 0).attr('cy', 0).attr('r', 20).attr('fill', 'red');
    }

    groupBy(type) {
        const mapping = {
            "gender": [
                {
                    query: { type: "Man" },
                    title: "Man"
                },
                {
                    query: { type: "Woman" },
                    title: "Woman"
                }
            ]
        }
        this.groupByType(mapping[type]);
    }
}