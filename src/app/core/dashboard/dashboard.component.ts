import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  dataObj1 = {
    yearlyDataSource: new MatTableDataSource(),
    monthlyDataSource: new MatTableDataSource(),
    weeklyDataSource: new MatTableDataSource(),
    dailyDataSource: new MatTableDataSource()
  };

  dataObj2 = {
    yearlyDataSource: new MatTableDataSource(),
    monthlyDataSource: new MatTableDataSource(),
    weeklyDataSource: new MatTableDataSource(),
    dailyDataSource: new MatTableDataSource()
  };

  dataForm1: FormGroup;
  dataForm2: FormGroup;

  offices: [] = [];
  reps: [] = [];
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  weeks: number[] = [];
  mainFilterChange1: boolean = false;
  mainFilterChange2: boolean = false;

  displayedColumns: string[] = ['duration', 'sold', 'pulled', 'holidays', 'newClients', 'credit',
      'interviews', 'day1', 'day2', 'percentage'];

  @ViewChild(MatSort, {static: false}) set yearlySort1(sort: MatSort) {
    this.dataObj1.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set monthlySort1(sort: MatSort) {
    this.dataObj1.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set weeklySort1(sort: MatSort) {
    this.dataObj1.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set dailySort1(sort: MatSort) {
    this.dataObj1.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set yearlySort2(sort: MatSort) {
    this.dataObj2.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set monthlySort2(sort: MatSort) {
    this.dataObj2.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set weeklySort2(sort: MatSort) {
    this.dataObj2.monthlyDataSource.sort = sort;
  }

  @ViewChild(MatSort, {static: false}) set dailySort2(sort: MatSort) {
    this.dataObj2.monthlyDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataForm1 = new FormGroup({
      office: new FormControl('', [Validators.required]),
      rep: new FormControl('all'),
      year: new FormControl(''),
      month: new FormControl(''),
      week: new FormControl('')
    });

    this.dataForm2 = new FormGroup({
      office: new FormControl('', [Validators.required]),
      rep: new FormControl('all'),
      year: new FormControl(''),
      month: new FormControl(''),
      week: new FormControl('')
    });

    this.dataService.getOffices().subscribe((response) => {
      if (response) {
        this.offices = response.offices;
      } else {
        this.displaySnackbar('No data found', 'warning');
      }
    },
    () => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });

    this.dataService.getReps({}).subscribe((response) => {
      if (response) {
        this.reps = response.reps;
      } else {
        this.displaySnackbar('No data found', 'warning');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });

    this.dataService.getYears().subscribe((response: any) => {
      this.years = response.yearData;
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  populateWeeks(event) {
    const dateObj = moment().isoWeekYear(parseInt(this.dataForm1.get('year').value)).toDate();
    const startDate = moment(dateObj).month(event.value - 1).startOf('month');
    const endDate = moment(dateObj).month(event.value - 1).endOf('month');
    this.weeks = [];
    for (let count = 1; count <= Math.ceil((endDate.diff(startDate, 'days') + 1) / 7); count++) {
      this.weeks.push(count);
    }
  }

  fetchRepsByOffice(id) {
    if (id !=='' && id !== 'all') {
      this.dataService.getReps({officeId: id}).subscribe((response) => {
        if (response) {
          this.reps = response.reps;
        } else {
          this.displaySnackbar('No data found', 'warning');
        }
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  fetchData1() {
    this.dataService.getDashboardData(this.formatReqObject(this.dataForm1)).subscribe(response => {
      if (this.mainFilterChange1) {
        this.clearData1();
      }
      this.mainFilterChange1 = false;
      if (response.durationType === 'Year') {
        this.dataObj1.yearlyDataSource.data = response.dashboardData;
        this.dataObj1.yearlyDataSource.sort = this.yearlySort1;
      } else if (response.durationType === 'Month') {
        this.dataObj1.monthlyDataSource.data = response.dashboardData;
        this.dataObj1.weeklyDataSource.sort = this.monthlySort1;
      } else if (response.durationType === 'Week') {
        this.dataObj1.weeklyDataSource.data = response.dashboardData;
        this.dataObj1.weeklyDataSource.sort = this.weeklySort1;
      } else if (response.durationType === 'Day') {
        this.dataObj1.dailyDataSource.data = response.dashboardData;
        this.dataObj1.dailyDataSource.sort = this.dailySort1;
      }
    });
  }

  fetchData2() {
    this.dataService.getDashboardData(this.formatReqObject(this.dataForm2)).subscribe(response => {
      if (this.mainFilterChange2) {
        this.clearData2();
      }
      this.mainFilterChange2 = false;
      if (response.durationType === 'Year') {
        this.dataObj2.yearlyDataSource.data = response.dashboardData;
        this.dataObj2.yearlyDataSource.sort = this.yearlySort2;
      } else if (response.durationType === 'Month') {
        this.dataObj2.monthlyDataSource.data = response.dashboardData;
        this.dataObj2.weeklyDataSource.sort = this.monthlySort2;
      } else if (response.durationType === 'Week') {
        this.dataObj2.weeklyDataSource.data = response.dashboardData;
        this.dataObj2.weeklyDataSource.sort = this.weeklySort2;
      } else if (response.durationType === 'Day') {
        this.dataObj2.dailyDataSource.data = response.dashboardData;
        this.dataObj2.dailyDataSource.sort = this.dailySort2;
      }
    });
  }

  filterChange1() {
    this.mainFilterChange1 = true;
  }

  filterChange2() {
    this.mainFilterChange2 = true;
  }

  formatReqObject(form: FormGroup) {
    return {
      office: form.get('office').value === 'all' ? null : form.get('office').value,
      rep: form.get('rep').value === 'all' ? null : form.get('rep').value,
      year: form.get('year').value,
      month: form.get('month').value,
      week: form.get('week').value,
      years: this.years
    };
  }

  clearData1() {
    this.dataObj1.yearlyDataSource = new MatTableDataSource();
    this.dataObj1.monthlyDataSource = new MatTableDataSource();
    this.dataObj1.weeklyDataSource = new MatTableDataSource();
    this.dataObj1.dailyDataSource = new MatTableDataSource();
  }

  clearData2() {
    this.dataObj2.yearlyDataSource = new MatTableDataSource();
    this.dataObj2.monthlyDataSource = new MatTableDataSource();
    this.dataObj2.weeklyDataSource = new MatTableDataSource();
    this.dataObj2.dailyDataSource = new MatTableDataSource();
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg },
      panelClass: className
    });
  }
}
