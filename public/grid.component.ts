import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
import '@swimlane/ngx-datatable/release/index.css';
import '@swimlane/ngx-datatable/release/themes/material.css';
import '@swimlane/ngx-datatable/release/assets/icons.css';
import {find, values} from "lodash";
import { DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
    selector: 'admin-grid',
    template: `
        <h1>Edit Entries</h1>
        <p>Double-click to edit an entry.</p>
        <div
        *ngIf="!rows"
        >Loading...<br/><br/></div>
        <input
            type='text'
            style='padding:8px;margin:15px auto;width:30%;'
            placeholder='Type to filter...'
            (keyup)='updateFilter($event)'
        />
        <ngx-datatable
            #table
            class="material"
            [rows]="rows"
            [columns]="columns"
            [limit]="20"
            [columnMode]="'force'"
            [headerHeight]="50"
            [footerHeight]="50"

            >
        </ngx-datatable>
        <ng-template #editableCellTemplate let-row="row" let-value="value" let-i="column.prop" let-rowIndex="rowIndex">
            <div>
                <div
                title="Double click to edit"
                (dblclick)="editing[rowIndex + '-' + i] = true"
                *ngIf="!editing[rowIndex + '-' + i]"
                >
                {{value || "None"}}
                </div>
                <div
                    contenteditable
                    style="overflow: auto"
                    [textContent]="value" (blur)="updateValue($event.target.textContent, i, rowIndex)"
                    autofocus
                    *ngIf="editing[rowIndex+ '-' + i]"></div>
            </div>
        </ng-template>
    `
})
export class GridComponent {
    rows: any[] = [];
    temp: any[] = [];
    entries: any[] = [];
    columns: any = [];
    editing = {};
    @ViewChild('editableCellTemplate') editableCellTemplate!: TemplateRef<any>;
    @ViewChild(DatatableComponent) table!: DatatableComponent;
    constructor() {
    }
    ngOnInit() {
        // todo: _formatted
        // let columns = ["index", "fullName", "biography", "tours", "narrative", "notes"];
        let columns = ["entryIndex", "tourIndex", "place", "tourStartFrom", "tourStartTo", "tourEndFrom", "tourEndTo", "longitude", "latitude"];
        this.columns = columns.map(e => {
            let column = { prop: e, name: e.toUpperCase() };
            if (e == "index") {
            }
            else {
                column["cellTemplate"] = this.editableCellTemplate;
            }
            return column;
        }
        );

        fetch("/api/entries").then(e => e.json()).then(e => {
            this.entries = e;
            let arrays = this.entries.map(entry => 
                entry.travels.map(e => ({...e, "entryIndex": entry.index}))
            );
            this.rows = [].concat.apply([], arrays);
            this.temp = [...this.rows];
            // console.log(this.rows);
        });
    }

    ngAfterViewInit() {
    }

    updateValue(value, cell, rowIndex) {
        const entry = find(this.entries, {index: this.rows[rowIndex].entryIndex});
        // console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        this.rows[rowIndex][cell] = value;
        this.rows = [...this.rows];
        console.log('UPDATED!', entry, this.rows[rowIndex][cell]);
    }
    updateFilter(event) {
        const val = event.target.value.toLowerCase();
    
        // filter our data
        const temp = this.temp.filter(function(d) {
          return d.place.toLowerCase().indexOf(val) !== -1 || !val;
          //return values(d).join(" ").toLowerCase().indexOf(val) !== -1 || !val;
        });
    
        // update the rows
        this.rows = temp;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
      }
}