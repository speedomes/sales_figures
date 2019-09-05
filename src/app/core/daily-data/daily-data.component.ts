import { Component, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-daily-data',
  templateUrl: './daily-data.component.html',
  styleUrls: ['./daily-data.component.scss']
})
export class DailyDataComponent implements OnInit {

  selectedIndex: number;
  dailyDataSource =  new MatTableDataSource();

  displayedColumns: string[] = ['date', 'office', 'repId', 'vehicle', 'sold',
    'pulled', 'clients', 'credit', 'balance', 'unused', 'in', 'day1', 'day2', 'st', 'name'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getDailyData().subscribe((response) => {
      this.dailyDataSource.data = response.dailyData;
      this.dailyDataSource.paginator = this.paginator;
      this.dailyDataSource.sort = this.sort;
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }
}
