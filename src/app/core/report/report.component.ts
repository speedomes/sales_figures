import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AngularCsv } from 'angular-csv-ext/dist/Angular-csv';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  selectedYear: number;
  selectedWeek: number;
  totalWeeks: number[] = [];

  pulledDataSource = [{
    name: 'testName',
    office: 'london',
    week: 3,
    month: 6,
    year: 2019
  }];

  displayedColumns: string[] = ['name', 'office', 'week', 'month', 'year'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    for ( let count = 1; count <= 52; count++ ) {
      this.totalWeeks.push(count);
    }
  }

  exportToCSV() {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Report',
      useBom: true,
      noDownload: false,
      headers: ['Name', 'Office', 'Week', 'Month', 'Year'],
      nullToEmptyString: true,
    };
    let csv = new AngularCsv(this.pulledDataSource, 'Report', csvOptions);
  }

}
