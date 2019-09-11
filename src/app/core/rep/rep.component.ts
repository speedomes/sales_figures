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
  offices: [] = [];
  vehicles: [] = [];
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

    this.dataService.getOffices().subscribe((response) => {
      if(response && response.offices) {
        this.offices = response.offices;
      }
    });
    
    this.dataService.getVehicles().subscribe((response) => {
      if(response && response.vehicles) {
        this.vehicles = response.vehicles;
      }
    });
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedRep = rowData;
    
    this.repForm.setValue({ 
      id: rowData.id,
      repName: rowData.repName,
      balance: rowData.balance,
      officeName: rowData.office_id,
      vehicleName: rowData.vehicle_id
    });
  }

  getReps() {
    this.dataService.getReps().subscribe((response) => {
      if(response.reps && response.reps.length > 0) {
        this.repDataSource.data = response.reps;
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  addRep() {
    if(this.selectedRep &&
        (this.repForm.get('repName').value === this.selectedRep.repName)) {
        this.displaySnackbar('Rep name already exists!', 'warning');
        return;
    } else {
      this.dataService.addRep({
        id: this.repForm.get('id').value, 
        name: this.repForm.get('repName').value,
        balance: this.repForm.get('balance').value,
        officeId: this.repForm.get('officeName').value,
        vehicleId: this.repForm.get('vehicleName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Rep name has been added successfully!');
        this.clearSelection();
        this.getReps();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  updateRep() {
    if(this.repForm.get('repName').value === this.selectedRep.repName) {
      this.displaySnackbar('No update required!');
      return;
    } else {
      this.dataService.updateRep({
        id: this.repForm.get('id').value, 
        name: this.repForm.get('repName').value,
        balance: this.repForm.get('balance').value,
        officeId: this.repForm.get('officeName').value,
        vehicleId: this.repForm.get('vehicleName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Rep has been updated successfully');
        this.clearSelection();
        this.getReps();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  deleteRep() {
    if(this.repForm.get('repName').value !== this.selectedRep.repName) {
      this.displaySnackbar('Please select an rep.', 'warning');
      return;
    } else {
      this.dataService.deleteRep({
        id: this.repForm.get('id').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Rep name has been deleted successfully!');
        this.clearSelection();
        this.getReps();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  clearSelection() {
    this.repForm.setValue({ 
      id: '',
      repName: '',
      balance: '',
      officeName: '',
      vehicleName: ''
    });
    this.selectedRep = undefined;
    this.selectedIndex = undefined;
  }

  displaySnackbar(message: string, className: string = 'primary') {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: { message: message },
      panelClass: className
    });
  }
}
