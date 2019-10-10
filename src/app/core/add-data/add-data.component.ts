import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/data.service';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-data',
  templateUrl: './add-data.component.html',
  styleUrls: ['./add-data.component.scss']
})
export class AddDataComponent implements OnInit {

  filterType: string;
  dataForm: FormGroup;
  dataEntryForm: FormGroup;
  isSearchStarted: boolean = false;
  isDataLoaded: boolean = false;
  placeHolder: string = environment.placeHolderText;
  dataSource =  new MatTableDataSource();
  totalPulled: number;
  totalNewClients: number;
  totalCredit: number;
  totalVehicles: number;
  splitCash: number;
  splitCard: number;
  totalSplit: number;

  doFilter = {
    offices: [],
    reps: []
  };

  offices: [] = [];
  reps: [] = [];
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  weeks: number[] = [];

  displayedColumns: string[] = ['date', 'officeName', 'repId', 'repName', 'vehicle', 'sold',
      'pulled', 'newClients', 'credit', 'balance', 'inuse', 'day1', 'day2'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataForm = new FormGroup({
      year: new FormControl('', [Validators.required]),
      month: new FormControl(''),
      week: new FormControl(''),
      office: new FormControl(''),
      rep: new FormControl('')
    });

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
    const dateObj = moment().isoWeekYear(parseInt(this.dataForm.get('year').value)).toDate();
    const startDate = moment(dateObj).month(event.value - 1).startOf('month');
    const endDate = moment(dateObj).month(event.value - 1).endOf('month');
    this.weeks = [];
    for (let count = 1; count <= Math.ceil((endDate.diff(startDate, 'days') + 1) / 7); count++) {
      this.weeks.push(count);
    }
  }

  filterData() {
    this.isSearchStarted = true;
    this.dataService.getScopeData(this.formatReqObject(this.dataForm)).subscribe(response => {
      this.dataSource.data = response.scopeData.data;
      this.totalPulled = response.scopeData.totalPulled;
      this.totalNewClients = response.scopeData.totalNewClients;
      this.totalCredit = response.scopeData.totalCredit;
      this.totalVehicles = response.scopeData.totalVehicles;
      this.splitCash = response.scopeData.cash;
      this.splitCard = response.scopeData.cards;
      this.totalSplit = this.splitCash + this.splitCard;
      this.isDataLoaded = true;
    });
  }

  fetchRepsByOffice(id) {
    if (id!== '' && id!== 'all') {
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

  filterUpdate(filterType) {
    if (filterType === 'filterByDateOffice') {
      this.dataEntryForm = new FormGroup({
        office: new FormControl('', [Validators.required]),
        rep: new FormControl('', [Validators.required]),
        repSold: new FormControl(''),
        repPulled: new FormControl(''),
        repNC: new FormControl(''),
        repCredit: new FormControl(''),
        repInt: new FormControl(''),
        repDay1: new FormControl(''),
        repDay2: new FormControl(''),
        repBalance: new FormControl(''),
        repBalanceB: new FormControl(''),
        repVehicle: new FormControl(''),
        date: new FormControl('', [Validators.required])
      });

      this.dataService.getOffices().subscribe((response) => {
        if (response) {
          this.doFilter.offices = response.offices;
        } else {
          this.displaySnackbar('No data found', 'warning');
        }
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });

      this.dataService.getReps({}).subscribe((response) => {
        if (response) {
          this.doFilter.reps = response.reps;
        } else {
          this.displaySnackbar('No data found', 'warning');
        }
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  checkRecord() {
    const data = {
      repId: this.dataEntryForm.get('rep').value,
      officeId: this.dataEntryForm.get('office').value,
      date: this.dataEntryForm.get('date').value
    };

    this.dataService.checkRecord(data).subscribe((response: any) => {
      if (response.records.length > 0) {
        
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
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
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: msg },
      panelClass: className
    });
  }

}
