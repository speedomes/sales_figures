import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-daily-data',
  templateUrl: './daily-data.component.html',
  styleUrls: ['./daily-data.component.scss']
})
export class DailyDataComponent implements OnInit {

  selectedIndex: number;
  dataLoaded: boolean = false;
  dailyDataSource;

  displayedColumns: string[] = ['date', 'office', 'repId', 'vehicle', 'sold',
    'pulled', 'clients', 'credit', 'balance', 'unused', 'in', 'day1', 'day2', 'st', 'name'];

  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

  constructor(private dataService: DataService,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.dailyDataSource = new MatTableDataSource();
    this.dailyDataSource.paginator = this.paginator;
    this.fetchData(1, 200);
  }

  fetchData(sOffset, eOffset) {
    this.dataService.getDailyData({startLimit: sOffset, endLimit: eOffset}).subscribe((response) => {
      this.dailyDataSource.data = this.dailyDataSource.data.concat(response.dailyData);
      this.dataLoaded = true;
      this.changeDetectorRefs.detectChanges();
      this.dailyDataSource.paginator = this.paginator;

      const subscription = this.dailyDataSource.paginator.page.subscribe((data) => {
        const isDataFetchRequired = (data.pageIndex > data.previousPageIndex) 
          && (this.dailyDataSource.data.length - ((data.pageIndex + 1) * data.pageSize)) == data.pageSize;

        if(isDataFetchRequired) {
          this.fetchData(this.dailyDataSource.data.length + 1, 100);
          subscription.unsubscribe();
        }
      });
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }
}
