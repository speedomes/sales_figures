import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-vehicle',
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss']
})
export class VehicleComponent implements OnInit {

  selectedVehicle: string;
  vehicleToModify: string;
  showError: boolean = false;

  vehicleData = [
    { vehicle: 'Cornwall' },
    { vehicle: 'Oxford' }
  ];

  vehicleDataSource =  new MatTableDataSource(this.vehicleData);

  displayedColumns: string[] = ['vehicle'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor() { }

  ngOnInit() {
    this.vehicleDataSource.paginator = this.paginator;
    this.vehicleDataSource.sort = this.sort;
  }

  populateData(rowData: any) {
    this.selectedVehicle = rowData.vehicle;
    this.vehicleToModify = rowData.vehicle;
  }

  addvehicleData() {
    this.showError = false;

    this.vehicleDataSource.data.filter((value) => {
      if (value.vehicle === this.selectedVehicle) {
        this.showError = true;
      }
      return true;
    });

    if (!this.showError) {
      this.vehicleDataSource.data.push({ vehicle: this.selectedVehicle });
      this.vehicleDataSource.filter = '';
      this.showError = false;
    }
  }

  updatevehicleData() {
    this.vehicleDataSource.data.filter((value) => {
      if (value.vehicle === this.vehicleToModify) {
        value.vehicle = this.selectedVehicle;
        this.vehicleToModify = this.selectedVehicle;
      }
      return true;
    });
  }

  removevehicleData() {
    this.vehicleDataSource.data.filter((value, index) => {
      if ((this.vehicleToModify && value.vehicle === this.vehicleToModify)
        || (value.vehicle === this.selectedVehicle)) {
        this.vehicleDataSource.data.splice(index, 1);
        this.vehicleDataSource.filter = '';
        this.clearSelection();
      }
      return true;
    });
  }

  clearSelection() {
    this.selectedVehicle = undefined;
    this.vehicleToModify = undefined;
  }

}
