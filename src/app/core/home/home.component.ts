import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('sidenav', {static: false}) sidenav: MatSidenav;
  
  constructor() { }

  ngOnInit() {
  }

  close() {
    this.sidenav.close();
  }


}
