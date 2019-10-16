import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data-filter-by-value',
  templateUrl: './data-filter-by-value.component.html',
  styleUrls: ['./data-filter-by-value.component.scss']
})
export class DataFilterByValueComponent implements OnInit {

  dataForm: FormGroup;
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
  offices: [] = [];
  reps: [] = [];
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  weeks: number[] = [];
  isDataComplete: boolean = false;
  isDataSearched: boolean = false;
  isPaginationClicked: boolean = false;

  displayedColumns: string[] = ['date', 'officeName', 'repId', 'repName', 'vehicle', 'sold',
    'pulled', 'newClients', 'credit', 'balance', 'inuse', 'day1', 'day2'];

  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

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

  filterData(sOffset = 1, eOffset = 300) {
    this.isSearchStarted = true;
    this.dataService.getScopeData(this.formatReqObject(this.dataForm, sOffset, eOffset)).subscribe(response => {
      this.isDataSearched = true;
      this.dataSource.data = this.isPaginationClicked ? this.dataSource.data.concat(response.scopeData.data) : response.scopeData.data;
      this.dataSource.paginator = this.paginator;
      this.totalPulled = response.scopeData.totalPulled;
      this.totalNewClients = response.scopeData.totalNewClients;
      this.totalCredit = response.scopeData.totalCredit;
      this.totalVehicles = response.scopeData.totalVehicles;
      this.splitCash = response.scopeData.cash;
      this.splitCard = response.scopeData.cards;
      this.totalSplit = this.splitCash + this.splitCard;
      this.isDataLoaded = true;

      if (this.dataSource.paginator) {
        const subscription = !this.isDataComplete && this.dataSource.paginator.page.subscribe((data) => {
          const isDataFetchRequired = (data.pageIndex > data.previousPageIndex);

          if (isDataFetchRequired) {
            this.isPaginationClicked = true;
            this.isDataLoaded = false;
            this.filterData(this.dataSource.data.length + 1, 200);
            this.isDataLoaded = true;
            this.isPaginationClicked = false;
            subscription.unsubscribe();
          }
        });
      }
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

  formatReqObject(form: FormGroup, sOffset, eOffset) {
    return {
      office: form.get('office').value === 'all' ? null : form.get('office').value,
      rep: form.get('rep').value === 'all' ? null : form.get('rep').value,
      year: form.get('year').value,
      month: form.get('month').value,
      week: form.get('week').value,
      years: this.years,
      startLimit: sOffset,
      endLimit: eOffset
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
