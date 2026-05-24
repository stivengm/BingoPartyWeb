import { Component, OnInit, signal } from '@angular/core';
import { DataAppService } from '../../core/services/data-app.service';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader implements OnInit {

  constructor(private dataApp: DataAppService) {
  }
  
  ngOnInit(): void {
    
  }

}
