import { Component, ViewChild} from '@angular/core';
import {ElementRef,Renderer2} from '@angular/core';
const SocialCalc = require('socialcalc');

@Component({
    selector: 'admin-grid',
    template: `
        <h1>test</h1><div #sheet>Sheet here.</div>
        <ngx-datatable
            [rows]="rows"
            [columns]="columns">
        </ngx-datatable>
    `
    // template: `
    //   <h2>Windstorm details!</h2>
    //   <div><label>id: {{title}} </label>1</div>
    // `
})
export class GridComponent {
    rows = [
        { name: 'Austin', gender: 'Male', company: 'Swimlane' },
        { name: 'Dany', gender: 'Male', company: 'KFC' },
        { name: 'Molly', gender: 'Female', company: 'Burger King' },
      ];
      columns = [
        { prop: 'name' },
        { name: 'Gender' },
        { name: 'Company' }
      ];
    // title: string;
    constructor() {
        // this.title = 'Awesome, Inc. Internal Ordering System';
    }
    
    ngAfterViewInit() { 
    }    
}