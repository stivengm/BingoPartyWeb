import { Component } from '@angular/core';
import { Version } from "../../shared/version/version";

@Component({
  selector: 'app-welcome-view',
  imports: [Version],
  templateUrl: './welcome-view.html',
  styleUrl: './welcome-view.scss',
})
export class WelcomeView {}
