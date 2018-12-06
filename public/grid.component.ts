import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
import '@swimlane/ngx-datatable/release/index.css';
import '@swimlane/ngx-datatable/release/themes/material.css';
import '@swimlane/ngx-datatable/release/assets/icons.css';
import {find} from "lodash";

@Component({
    selector: 'admin-grid',
    template: `
        <h1>Edit Entries</h1>
        <div
        *ngIf="!rows"
        >Loading...<br/><br/></div>
        <ngx-datatable
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
                {{value}}
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
    entries: any[] = [];
    columns: any = [];
    editing = {};
    @ViewChild('editableCellTemplate') editableCellTemplate!: TemplateRef<any>;
    constructor() {
    }
    ngOnInit() {
        // todo: _formatted
        // let columns = ["index", "fullName", "biography", "tours", "narrative", "notes"];
        let columns = ["tourIndex", "place", "tourStartFrom", "tourStartTo", "tourEndFrom", "tourEndTo", "longitude", "latitude"];
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
}