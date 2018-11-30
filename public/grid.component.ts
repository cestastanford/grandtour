import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
const SocialCalc = require('socialcalc');

@Component({
    selector: 'admin-grid',
    template: `
        <h1>test</h1><div #sheet>Sheet here.</div>
        <ngx-datatable
            [rows]="rows"
            [columns]="columns">
        </ngx-datatable>
        <ng-template #roleTemplate let-row="row" let-value="value" let-i="index" let-rowIndex="rowIndex">
            <span
            title="Double click to edit"
            (dblclick)="editing[rowIndex + '-' + i] = true"
            *ngIf="!editing[rowIndex + '-' + i]">
            {{value}}{{rowIndex}}-{{i}}
            </span>
            <input
                autofocus
                (blur)="updateValue($event, i, rowIndex)"
                *ngIf="editing[rowIndex+ '-' + i]"
                type="text"
                [value]="value"
            />
        </ng-template>
    `
    // template: `
    //   <h2>Windstorm details!</h2>
    //   <div><label>id: {{title}} </label>1</div>
    // `
})
export class GridComponent {
    // title: string;
    rows: any;
    columns: any;
    editing = {};
    @ViewChild('roleTemplate') cellTemplate!: TemplateRef<any>;
    constructor() {
        // this.title = 'Awesome, Inc. Internal Ordering System';
    }
    ngOnInit() {
        this.rows = [
            { name: 'Austin', gender: 'Male', company: 'Swimlane' },
            { name: 'Dany', gender: 'Male', company: 'KFC' },
            { name: 'Molly', gender: 'Female', company: 'Burger King' },
        ];
        this.columns = [
            { prop: 'name', cellTemplate: this.cellTemplate },
            { name: 'Gender', cellTemplate: this.cellTemplate },
            { name: 'Company', cellTemplate: this.cellTemplate }
        ];
    }

    ngAfterViewInit() {
    }

    updateValue(event, cell, rowIndex) {
        console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        this.rows[rowIndex][cell] = event.target.value;
        this.rows = [...this.rows];
        console.log('UPDATED!', this.rows[rowIndex][cell]);
    }
}