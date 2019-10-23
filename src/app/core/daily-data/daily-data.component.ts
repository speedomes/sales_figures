import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DataService } from 'src/app/data.service';
import { environment } from 'src/environments/environment';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';

@Component({
  selector: 'app-daily-data',
  templateUrl: './daily-data.component.html',
  styleUrls: ['./daily-data.component.scss']
})
export class DailyDataComponent implements OnInit {

  selectedIndex: number;
  dataLoaded: boolean = false;
  dailyDataSource = new MatTableDataSource();
  placeHolderText: string = environment.placeHolderText;
  dataForm: FormGroup;
  years: [] = [];
  months: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  isFilteredData: boolean = false;
  isResetData: boolean = true;
  isDataComplete: boolean = false;

  displayedColumns: string[] = ['date', 'office', 'repId', 'vehicle', 'sold',
    'pulled', 'clients', 'credit', 'balance', 'unused', 'in', 'day1', 'day2', 'st', 'name'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.dailyDataSource.paginator = paginator;
  }

  constructor(private dataService: DataService,  private snackBar: MatSnackBar,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataForm = new FormGroup({
      year: new FormControl('', [Validators.required]),
      month: new FormControl('')
    });

    this.dataService.getYears().subscribe((response: any) => {
      this.years = response.yearData;
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });

    this.fetchData(1, 300);
  }

  fetchData(sOffset, eOffset) {
    this.dataService.getDailyData({startLimit: sOffset, endLimit: eOffset}).subscribe((response) => {
      if (response.dailyData.length > 0) {
        this.dailyDataSource.data = this.dailyDataSource.data.concat(response.dailyData);
        this.dataLoaded = true;
        if (this.dailyDataSource.paginator) {
          const subscription = !this.isDataComplete && this.dailyDataSource.paginator.page.subscribe((data) => {
            const isDataFetchRequired = (data.pageIndex > data.previousPageIndex);

            if (isDataFetchRequired) {
              this.dataLoaded = false;
              if (this.isFilteredData) {
                this.isResetData = false;
                this.updateData(this.dailyDataSource.data.length + 1, 200);
              } else {
                this.fetchData(this.dailyDataSource.data.length + 1, 200);
              }
              this.dataLoaded = true;
              subscription.unsubscribe();
            }
          });
        }
      } else {
        this.isDataComplete = true;
        this.dataLoaded = true;
        console.log('data complete');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  updateData(sOffset: number = 1, eOffset: number = 300) {
    this.dataLoaded = false;
    if (this.isResetData) {
      this.dailyDataSource.data = [];
      this.changeDetectorRefs.detectChanges();
    }

    this.isFilteredData = true;
    const filterConfig: any = {
      startLimit: sOffset,
      endLimit: eOffset,
      year: this.dataForm.get('year').value,
      month: this.dataForm.get('month').value
    };

    this.dataService.getDailyDataByFilter(filterConfig).subscribe((response) => {
      if (response.dailyData.length > 0) {
        this.dailyDataSource.data = this.dailyDataSource.data.concat(response.dailyData);
        this.dataLoaded = true;
        if (this.dailyDataSource.paginator) {
          const subscription = this.dailyDataSource.paginator.page.subscribe((data) => {
            this.dataLoaded = false;
            const isDataFetchRequired = (data.pageIndex > data.previousPageIndex);

            if (isDataFetchRequired) {
              if (this.isFilteredData) {
                this.isResetData = false;
                this.updateData(this.dailyDataSource.data.length + 1, 200);
              } else {
                this.fetchData(this.dailyDataSource.data.length + 1, 200);
              }
              this.dataLoaded = true;
              subscription.unsubscribe();
            }
          });
        }
      } else {
        this.isDataComplete = true;
        console.log('data complete');
      }
    },
    (error) => {
      this.dataLoaded = true;
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg },
      panelClass: className
    });
  }
}
