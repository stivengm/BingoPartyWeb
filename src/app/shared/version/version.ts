import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-version',
  imports: [],
  templateUrl: './version.html',
  styleUrl: './version.scss',
})
export class Version {

  version = environment.version;

}
