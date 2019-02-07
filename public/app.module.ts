import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import moduleName from './app.module.ajs';
import { GridComponent } from './grid.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { VisualizationComponent } from './visualization.component';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        NgxDatatableModule,
        HttpClientModule
    ],
    declarations: [
        GridComponent,
        VisualizationComponent
    ],
    entryComponents: [
        GridComponent,
        VisualizationComponent
    ]
})
export class AppModule {
    constructor(private upgrade: UpgradeModule) {
    }
    ngDoBootstrap(){
        this.upgrade.bootstrap(document.documentElement as Element, [moduleName], {strictDi: true});
    }
}