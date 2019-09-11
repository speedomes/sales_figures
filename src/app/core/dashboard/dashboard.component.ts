import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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

  dataForm1: FormGroup;

  yearlyDataSource1 = new MatTableDataSource();
  offices: [] = [];
  reps: [] = [];
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  weeks: number[] = [];

  displayedColumns: string[] = ['duration','sold', 'pulled', 'holidays', 'newClients', 'credit',
      'interviews', 'day1', 'day2', 'percentage'];

  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(private dataService: DataService,
    private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataForm1 = new FormGroup({
      office: new FormControl('', [Validators.required]),
      rep: new FormControl('all'),
      year: new FormControl(''),
      month: new FormControl(''),
      week: new FormControl('')
    });

    this.dataService.getOffices().subscribe((response) => {
      if(response) {
        this.offices = response.offices;
      } else {
        this.displaySnackbar('No data found', 'warning');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });

    this.dataService.getReps().subscribe((response) => {
      if(response) {
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
    });
  }

  populateWeeks() {
    for (let count = 1; count <= 52; count++) {
      this.weeks.push(count);
    }
  }

  fetchData1() {
    this.dataService.getDashboardData(this.formatReqObject(this.dataForm1)).subscribe(response => {
      console.log(response);
      if(response.durationType === 'Year') {
        this.dataObj1.yearlyDataSource.data = response.dashboardData;
      } else if(response.durationType === 'Month') {
        this.dataObj1.monthlyDataSource.data = response.dashboardData;
      } else if(response.durationType === 'Week') {
        this.dataObj1.weeklyDataSource.data = response.dashboardData;
      }
    });
  }

  formatReqObject(form: FormGroup) {
    return {
      office: form.get('office').value === 'all' ? null : form.get('office').value,
      rep: form.get('rep').value === 'all' ? null : form.get('rep').value,
      year: form.get('year').value,
      month: form.get('month').value,
      week: form.get('week').value,
      years: this.years
    }
  }

  displaySnackbar(message: string, className: string = 'primary') {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: message },
      panelClass: className
    });
  }

}
