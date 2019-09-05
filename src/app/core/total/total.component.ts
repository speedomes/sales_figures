import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-total',
  templateUrl: './total.component.html',
  styleUrls: ['./total.component.scss']
})
export class TotalComponent implements OnInit {

  startDate: string;
  endDate: string;
  transFlexHireCount: number;
  reflexHireCount: number;
  northgateHireCount: number;
  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getTotalData().subscribe((response) => {
      this.startDate = response.totalData[0].startDate;
      this.endDate = response.totalData[0].endDate;
      this.transFlexHireCount = response.totalData[0].transFlexHireCount;
      this.reflexHireCount = response.totalData[0].reflexHireCount;
      this.northgateHireCount = response.totalData[0].northgateHireCount;
    });
  }

}
