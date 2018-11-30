import { Component, ViewChild} from '@angular/core';
import {ElementRef,Renderer2} from '@angular/core';
const SocialCalc = require('socialcalc');

@Component({
    selector: 'admin-grid',
<<<<<<< HEAD
    template: '<h1>test</h1><ng-datasheet [(data)]="data" headers="side"></ng-datasheet>'
=======
    template: '<h1>test</h1><div #sheet>Sheet here.</div><ng-datasheet headers="none" [(data)]="data"></ng-datasheet>'
>>>>>>> socialcalc
    // template: `
    //   <h2>Windstorm details!</h2>
    //   <div><label>id: {{title}} </label>1</div>
    // `
})
export class GridComponent {
    @ViewChild('sheet') sheet;
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
    constructor(private rd: Renderer2) {
        // this.title = 'Awesome, Inc. Internal Ordering System';
    }
    
    ngAfterViewInit() { 
        var socialCalcControl = new SocialCalc.SpreadsheetControl()
        socialCalcControl.InitializeSpreadsheetControl(this.sheet.nativeElement /*, height, width, spacebelow*/)
        
    }    
}