import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DataService } from 'src/app/data.service';
import { environment } from 'src/environments/environment';

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

  displayedColumns: string[] = ['date', 'office', 'repId', 'vehicle', 'sold',
    'pulled', 'clients', 'credit', 'balance', 'unused', 'in', 'day1', 'day2', 'st', 'name'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.dailyDataSource.paginator = paginator;
    if(paginator) {
      const subscription = this.dailyDataSource.paginator.page.subscribe((data) => {
        const isDataFetchRequired = (data.pageIndex > data.previousPageIndex);

        if (isDataFetchRequired) {
          this.fetchData(this.dailyDataSource.data.length + 1, 200);
          subscription.unsubscribe();
        }
      });
    }
  }

  constructor(private dataService: DataService,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.fetchData(1, 300);
  }

  fetchData(sOffset, eOffset) {
    this.dataService.getDailyData({startLimit: sOffset, endLimit: eOffset}).subscribe((response) => {
      this.dailyDataSource.data = this.dailyDataSource.data.concat(response.dailyData);
      this.dataLoaded = true;
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }
}
