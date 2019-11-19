import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent implements OnInit {

  selectedIndex: number;
  splitDataSource =  new MatTableDataSource();
  dataLoaded = false;
  placeHolderText: string = environment.placeHolderText;
  displayedColumns: string[] = ['date', 'name', 'cash', 'cards', 'total'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.splitDataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.splitDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataService.getSplitData().subscribe((response) => {
      this.dataLoaded = true;
      if (response && response.splitData.length > 0) {
        this.splitDataSource.data = response.splitData;
      } else {
        this.displaySnackbar('No data found');
      }
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }

  displaySnackbar(msg: string) {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg }
    });
  }
}
