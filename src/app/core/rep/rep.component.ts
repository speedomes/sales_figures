import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';

@Component({
  selector: 'app-rep',
  templateUrl: './rep.component.html',
  styleUrls: ['./rep.component.scss']
})
export class RepComponent implements OnInit {

  repForm: FormGroup;
  selectedIndex: number;
  selectedRep;
  repDataSource =  new MatTableDataSource();
  displayedColumns: string[] = ['id', 'repName', 'officeName', 'vehicleName', 'balance'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private dataService: DataService,
    private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.repForm = new FormGroup({
      id: new FormControl('', [Validators.required]),
      repName: new FormControl('', [Validators.required]),
      balance: new FormControl('', [Validators.required]),
      officeName: new FormControl('', [Validators.required]),
      vehicleName: new FormControl('', [Validators.required])
    });
    this.getReps();
    this.repDataSource.paginator = this.paginator;
    this.repDataSource.sort = this.sort;
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedRep = rowData;
    this.repForm.setValue({ repName: rowData.name });
  }

  getReps() {
    this.dataService.getReps().subscribe((response) => {
      if(response.reps && response.reps.length > 0) {
        this.repDataSource.data = response.reps;
      } else {
        this.displaySnackbar('No data found');
      }
    });
  }

  addRep() {
    if(this.selectedRep &&
        (this.repForm.get('repName').value === this.selectedRep.name)) {
        this.displaySnackbar('Rep name already exists!');
        return;
    } else {
      this.dataService.addRep({
        name: this.repForm.get('repName').value
      }).subscribe((response) => {
        this.displaySnackbar('Rep name has been added successfully!');
        this.clearSelection();
        this.getReps();
      });
    }
  }

  updateRep() {
    if(this.repForm.get('repName').value === this.selectedRep.name) {
      this.displaySnackbar('No update required!');
      return;
    } else {
      this.dataService.updateRep({
        id: this.selectedRep.id, 
        name: this.repForm.get('repName').value
      }).subscribe((response) => {
        this.displaySnackbar('Rep name has been updated successfully!');
        this.clearSelection();
        this.getReps();
      });
    }
  }

  deleteRep() {
    if(this.repForm.get('repName').value !== this.selectedRep.name) {
      this.displaySnackbar('Please select an rep.');
      return;
    } else {
      this.dataService.deleteRep({
        id: this.selectedRep.id
      }).subscribe((response) => {
        this.displaySnackbar('Rep name has been deleted successfully!');
        this.clearSelection();
        this.getReps();
      });
    }
  }

  clearSelection() {
    this.repForm.reset();
    this.selectedRep = undefined;
  }

  displaySnackbar(message: string) {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: message }
    });
  }
}
