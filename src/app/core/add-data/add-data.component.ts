import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss']
})
export class AddDataComponent implements OnInit {

  dataForm: FormGroup;
  dataEntryForm: FormGroup;
  hasDataLoaded: boolean = false;
  dataSource =  new MatTableDataSource([
    {
      date: '2019.02.01',
      office: 'Oxford',
      repId: 1231,
      name: 'Roger Pell',
      vehicle: 'BV17VYL',
      sold: 9,
      pulled: 9,
      newClients: 0,
      credit: 404.73,
      balance: 313.48,
      in: 0,
      day1: 0,
      day2: 0
    }
  ]);

  offices: [] = [];
  reps: [] = [];
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  weeks: number[] = [];

  displayedColumns: string[] = ['date', 'office', 'repId', 'name', 'vehicle', 'sold',
      'pulled', 'newClients', 'credit', 'balance', 'in', 'day1', 'day2'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  
  constructor(private dataService: DataService, private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataForm = new FormGroup({
      year: new FormControl('', [Validators.required]),
      month: new FormControl(''),
      week: new FormControl(''),
      office: new FormControl(''),
      rep: new FormControl('')
    });

    this.dataEntryForm = new FormGroup({});

    this.dataService.getOffices().subscribe((response) => {
      if (response) {
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

  filterData() {
    this.dataService.getScopeData(this.formatReqObject(this.dataForm)).subscribe(response => {
      console.log(response);
    });
  }

  saveData() {

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

  displaySnackbar(msg: string, className: string = 'primary') {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: msg },
      panelClass: className
    });
  }

}
