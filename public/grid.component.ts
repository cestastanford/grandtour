import { Component, NgModule } from '@angular/core';
import { NgDatasheetModule } from 'ngdatasheet/ngdatasheet';

@NgModule({
    imports: [
        NgDatasheetModule
    ]
})
@Component({
    selector: 'admin-grid',
    template: '<h1>test</h1>'// <ng-datasheet></ng-datasheet>
    // template: `
    //   <h2>Windstorm details!</h2>
    //   <div><label>id: {{title}} </label>1</div>
    // `
})
export class GridComponent {
    public data: any[][] = [
        ['Item', 'Unit price', 'Quantity', 'Price'],
        ['Joy Division shirt', 25, 4, 100],
        ['Cutoff jeans', 30, 24, 720],
        ['Peeps', 1.25, 100, 125],
        ['Subtotal', , , 945],
        ['Tax', , '3.0%', .03 * 945],
        ['Total', , , 945 + .03 * 945]
    ]
    // title: string;
    // constructor() {
    //     this.title = 'Awesome, Inc. Internal Ordering System';
    // }
}