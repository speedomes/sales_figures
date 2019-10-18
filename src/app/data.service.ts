import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  API_URL = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getDashboardData(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getDashboardData', data);
  }

  getYears() {
    return this.httpClient.get(this.API_URL + 'getYears');
  }

  getReport(reportConfig: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getReport', reportConfig);
  }

  getTotalData(): Observable<any> {
    return this.httpClient.get(this.API_URL + 'getTotalData');
  }

  getDailyData(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getDailyData', data);
  }

  getDailyDataByFilter(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getDailyDataByFilter', data);
  }

  getOffices(): Observable<any> {
    return this.httpClient.get(this.API_URL + 'getOffices');
  }

  addOffice(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'addOffice', data);
  }

  updateOffice(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'updateOffice', data);
  }

  deleteOffice(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'deleteOffice', data);
  }

  getVehicles(): Observable<any> {
    return this.httpClient.get(this.API_URL + 'getVehicles');
  }

  addVehicle(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'addVehicle', data);
  }

  updateVehicle(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'updateVehicle', data);
  }

  deleteVehicle(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'deleteVehicle', data);
  }

  getReps(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getReps', data);
  }

  addRep(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'addRep', data);
  }

  updateRep(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'updateRep', data);
  }

  deleteRep(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'deleteRep', data);
  }

  getSplitData(): Observable<any> {
    return this.httpClient.get(this.API_URL + 'getSplitData');
  }

  getScopeData(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getScopeData', data);
  }

  checkRecord(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'checkRecord', data);
  }

  addRecord(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'addRecord', data);
  }

  updateRecord(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'updateRecord', data);
  }

  saveSplit(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'saveSplit', data);
  }

  updateSplit(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'updateSplit', data);
  }

  getKPIData(data: {}): Observable<any> {
    return this.httpClient.post(this.API_URL + 'getKPIData', data);
  }
}
