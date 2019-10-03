import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from 'src/app/shared/snack-bar/snack-bar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss']
})
export class VehicleComponent implements OnInit {

  vehicleForm: FormGroup;
  selectedVehicle: any;
  showError: boolean = false;
  selectedIndex: number;
  dataLoaded: boolean = false;
  placeHolderText: string = environment.placeHolderText;
  vehicleDataSource =  new MatTableDataSource();
  displayedColumns: string[] = ['name'];

  @ViewChild(MatPaginator, {static: false}) set paginator(paginator: MatPaginator) {
    this.vehicleDataSource.paginator = paginator;
  }

  @ViewChild(MatSort, {static: false}) set sort(sort: MatSort) {
    this.vehicleDataSource.sort = sort;
  }

  constructor(private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getVehicles();
    this.vehicleForm = new FormGroup({
      vehicleName: new FormControl('', [Validators.required])
    });
  }

  populateData(rowData: any, index) {
    this.selectedIndex = index;
    this.selectedVehicle = rowData;
    this.vehicleForm.setValue({ vehicleName: rowData.name });
  }

  getVehicles() {
    this.dataService.getVehicles().subscribe((response) => {
      if (response.vehicles && response.vehicles.length > 0) {
        this.vehicleDataSource.data = response.vehicles;
        this.dataLoaded = true;
      } else {
        this.displaySnackbar('No data found');
      }
    },
    (error) => {
      this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
    });
  }

  addVehicle() {
    if (this.selectedVehicle &&
      (this.vehicleForm.get('vehicleName').value === this.selectedVehicle.name)) {
      this.displaySnackbar('Vehicle name already exists!', 'warning');
      return;
    } else {
      this.dataService.addVehicle({
        name: this.vehicleForm.get('vehicleName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Vehicle name has been added successfully!');
        this.clearSelection();
        this.getVehicles();
      },
      (error) => {
        this.displaySnackbar('Internal Server Error. Please try later.', 'warning');
      });
    }
  }

  updateVehicle() {
    if (this.vehicleForm.get('vehicleName').value === this.selectedVehicle.name) {
      this.displaySnackbar('No update required!');
      return;
    } else {
      this.dataService.updateVehicle({
        id: this.selectedVehicle.id, 
        name: this.vehicleForm.get('vehicleName').value
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Vehicle name has been updated successfully!');
        this.clearSelection();
        this.getVehicles();
      });
    }
  }

  deleteVehicle() {
    if (this.vehicleForm.get('vehicleName').value !== this.selectedVehicle.name) {
      this.displaySnackbar('Please select an vehicle', 'warning');
      return;
    } else {
      this.dataService.deleteVehicle({
        id: this.selectedVehicle.id
      }).subscribe((response) => {
        this.displaySnackbar((response && response.message) || 'Vehicle name has been deleted successfully!');
        this.clearSelection();
        this.getVehicles();
      });
    }
  }

  clearSelection() {
    this.vehicleForm.reset();
    this.selectedVehicle = undefined;
    this.selectedIndex = undefined;
  }

  displaySnackbar(msg: string, className: string = 'primary') {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: environment.snackBarTimeOut,
      data: { message: msg },
      panelClass: className
    });
  }
}
