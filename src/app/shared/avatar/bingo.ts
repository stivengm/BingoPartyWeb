import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar implements OnInit {
  
  listAvatares = [
    'astronauta_1',
    'astronauta_2',
    'gato',
    'leon',
    'perro',
    'pirata_1',
    'pirata_2',
    'reina',
    'rey',
    'robot',
    'vaca'
  ];

  avatarSelected: string = "";

  ngOnInit(): void {
    this.avatarSelected = this.listAvatares[Math.floor(Math.random() * this.listAvatares.length)];
  }
}
