import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';

@Component({
  selector: 'app-splite',
  templateUrl: './splite.component.html',
  styleUrls: ['./splite.component.scss']
})
export class SpliteComponent implements OnInit {

  selectedIndex: number;
  spliteDataSource =  new MatTableDataSource();
  dataLoaded: boolean = false;
  displayedColumns: string[] = ['date', 'name', 'cash', 'cards', 'viu', 'total'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private dataService: DataService,
    private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.dataService.getSpliteData().subscribe((response) => {
      this.dataLoaded = true;
      if(response && response.spliteData.length > 0) {
        this.spliteDataSource.data = response.spliteData;
        this.spliteDataSource.paginator = this.paginator;
        this.spliteDataSource.sort = this.sort;
      } else {
        this.displaySnackbar('No data found');
      }
    });
  }

  highlightRow(index) {
    this.selectedIndex = index;
  }

  displaySnackbar(message: string) {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: message }
    });
  }
}
