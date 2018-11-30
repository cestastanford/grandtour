import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
const SocialCalc = require('socialcalc');



@Component({
    selector: 'admin-grid',
    template: `
        <h1>test</h1><div #sheet>Sheet here.</div>
        <ngx-datatable
            [rows]="rows"
            [columns]="columns"
            [limit]="10"
            [columnMode]="'force'"
            class="material"
            [headerHeight]="50"
            [footerHeight]="50"
            [rowHeight]="'auto'"
            >
        </ngx-datatable>
        <ng-template #cellTemplate let-row="row" let-value="value" let-i="column.prop" let-rowIndex="rowIndex">
            <span
            title="Double click to edit"
            (dblclick)="editing[rowIndex + '-' + i] = true"
            *ngIf="!editing[rowIndex + '-' + i]"
            >
            {{value}}
            </span>
            <span
                contenteditable
                [textContent]="value" (blur)="updateValue($event.target.textContent, i, rowIndex)"
                autofocus
                *ngIf="editing[rowIndex+ '-' + i]"></span>
        </ng-template>
    `
    // template: `
    //   <h2>Windstorm details!</h2>
    //   <div><label>id: {{title}} </label>1</div>
    // `
})
export class GridComponent {
    // title: string;
    rows: any = [];
    columns: any = [];
    editing = {};
    @ViewChild('cellTemplate') cellTemplate!: TemplateRef<any>;
    constructor() {
        // this.title = 'Awesome, Inc. Internal Ordering System';
    }
    ngOnInit() {
        // todo: _formatted
        let columns = ["index", "biography", "tours", "narrative", "notes"];
        this.columns = columns.map(e => ({ prop: e, name: e.toUpperCase(), cellTemplate: this.cellTemplate }));

        fetch("/api/entries").then(e => e.json()).then(e => {
            this.rows = e;
        });
    }

    ngAfterViewInit() {
    }

    updateValue(value, cell, rowIndex) {
        // console.log(this.rows[rowIndex][cell]);
        // console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        this.rows[rowIndex][cell] = value;
        this.rows = [...this.rows];
        console.log('UPDATED!', this.rows[rowIndex][cell]);
    }
}