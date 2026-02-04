import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-add-card',
  imports: [Header],
  templateUrl: './add-card.html',
  styleUrl: './add-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCard {}
