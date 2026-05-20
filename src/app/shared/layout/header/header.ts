import { Component } from '@angular/core';
import { DataAppService } from '../../../core/services/data-app.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  constructor(private dataApp: DataAppService) {}

  goToHome() {
    this.dataApp.clearStorage();
    this.dataApp.goToPage('/welcome_view');
  }
}
