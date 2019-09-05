import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private httpClient: HttpClient) { }

  fetchDashboardData(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/dashboard');
  }

  getYears() {
    return this.httpClient.get('http://localhost:3000/api/getYears');
  }

  getReport(reportConfig: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/getReport', reportConfig);
  }

  getTotalData(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getTotalData');
  }

  getDailyData(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getDailyData');
  }

  getOffices(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getOffices');
  }

  addOffice(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/addOffice', data);
  }

  updateOffice(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/updateOffice', data);
  }

  deleteOffice(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/deleteOffice', data);
  }

  getVehicles(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getVehicles');
  }

  addVehicle(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/addVehicle', data);
  }

  updateVehicle(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/updateVehicle', data);
  }

  deleteVehicle(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/deleteVehicle', data);
  }

  getReps(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getReps');
  }

  addRep(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/addRep', data);
  }

  updateRep(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/updateRep', data);
  }

  deleteRep(data: {}): Observable<any> {
    return this.httpClient.post('http://localhost:3000/api/deleteRep', data);
  }

  getSpliteData(): Observable<any> {
    return this.httpClient.get('http://localhost:3000/api/getSpliteData');
  }
}
