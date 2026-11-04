import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-fullscreen-layout',
  imports: [RouterOutlet],
  templateUrl: './fullscreen-layout.html',
  styleUrl: './fullscreen-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenLayout {}