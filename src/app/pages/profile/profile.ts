import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-profile',
  imports: [Header],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {

}
