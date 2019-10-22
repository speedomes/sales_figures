import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import * as moment from 'moment';
import { AngularCsv } from 'angular-csv-ext/dist/Angular-csv';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { MatTableDataSource } from '@angular/material/table';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  reportForm: FormGroup;
  selectedYear: number;
  selectedWeek: number;
  totalWeeks: number[] = [];
  reportSuccess: boolean = false;
  startDate: string;
  endDate: string;
  years: any;

  pulledDataSource = new MatTableDataSource();
  newClientsDataSource = new MatTableDataSource();

  displayedColumns: string[] = ['repName', 'officeName', 'wData', 'mData', 'yData'];

  @ViewChild('dPaginator', {static: false}) dPaginator: MatPaginator;
  @ViewChild('dSort', {static: false}) dSort: MatSort;

  @ViewChild('cPaginator', {static: false}) cPaginator: MatPaginator;
  @ViewChild('cSort', {static: false}) cSort: MatSort;

  constructor(private dataService: DataService, private changeDetectorRefs: ChangeDetectorRef, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.reportForm = new FormGroup({
      year: new FormControl('', Validators.required),
      week: new FormControl('', Validators.required)
    });

    this.pulledDataSource.paginator = this.dPaginator;
    this.pulledDataSource.sort = this.dSort;
    this.newClientsDataSource.paginator = this.cPaginator;
    this.newClientsDataSource.sort = this.cSort;

    this.dataService.getYears().subscribe((response) => {
      this.years = response['yearData'];
    });

    for (let count = 1; count <= 52; count++) {
      this.totalWeeks.push(count);
    }
  }

  generateReport() {
    this.startDate = moment(moment().isoWeekYear(this.reportForm.get('year').value).isoWeekday('Tuesday').isoWeek(this.reportForm.get('week').value).toDate()).format('DD.MM.YYYY');
    this.endDate = moment(moment().isoWeekYear(this.reportForm.get('year').value).isoWeekday('Monday').isoWeek(this.reportForm.get('week').value + 1).toDate()).format('DD.MM.YYYY');;
    this.dataService.getReport({
      year: this.reportForm.get('year').value,
      week: this.reportForm.get('week').value,
    }).subscribe((response) => {
      this.reportSuccess = true;

      this.pulledDataSource.data = response.pulledData;
      this.changeDetectorRefs.detectChanges();

      this.newClientsDataSource.data = response.newClientsData;
      this.changeDetectorRefs.detectChanges();
      this.pulledDataSource.paginator = this.dPaginator;
      this.pulledDataSource.sort = this.dSort;
      this.newClientsDataSource.paginator = this.cPaginator;
      this.newClientsDataSource.sort = this.cSort;
      this.changeDetectorRefs.detectChanges();
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  exportToCSV() {
    const dataLabels = ['Name', 'Office', 'Week', 'Month', 'Year','','Name', 'Office', 'Week', 'Month', 'Year'];
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: `Report Week #${this.reportForm.get('week').value} ${this.startDate} - ${this.endDate}`,
      useBom: true,
      noDownload: false,
      headers: dataLabels,
      nullToEmptyString: true,
    };

    const dataCollection = [];

    this.pulledDataSource.data.forEach((data: any, index) => {
      const data1: any = this.newClientsDataSource.data[index];
      const reportObj = {
        name: data.repName,
        office: data.officeName,
        week: data.wData,
        month: data.mData,
        year: data.yData,
        space: '',
        name1: data1.repName,
        office1: data1.officeName,
        week1: data1.wData,
        month1: data1.mData,
        year1: data1.yData,
      }
      dataCollection[index] = reportObj;
    });

    new AngularCsv(dataCollection, "Report", csvOptions);
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: msg },
      panelClass: className
    });
  }
}
