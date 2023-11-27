import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import moduleName from './app.module.ajs';
import { GridComponent } from './grid.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ChartComponent } from './chart.component';
import { MapComponent } from './map.component';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        NgxDatatableModule,
        HttpClientModule,
        FormsModule
    ],
    declarations: [
        GridComponent,
        ChartComponent,
        MapComponent
    ],
    entryComponents: [
        GridComponent,
        ChartComponent,
        MapComponent
    ]
})
export class AppModule {
    constructor(private upgrade: UpgradeModule) {
    }
    ngDoBootstrap(){
        this.upgrade.bootstrap(document.documentElement as Element, [moduleName], {strictDi: true});
    }
}