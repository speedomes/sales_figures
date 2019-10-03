import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-splite',
  templateUrl: './splite.component.html',
  styleUrls: ['./splite.component.scss']
})
export class SpliteComponent implements OnInit {

  selectedIndex: number;
  spliteDataSource =  new MatTableDataSource();
  dataLoaded: boolean = false;
  placeHolderText: string = environment.placeHolderText;
  displayedColumns: string[] = ['date', 'name', 'cash', 'cards', 'viu', 'total'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.spliteDataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.spliteDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataService.getSpliteData().subscribe((response) => {
      this.dataLoaded = true;
      if (response && response.spliteData.length > 0) {
        this.spliteDataSource.data = response.spliteData;
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
