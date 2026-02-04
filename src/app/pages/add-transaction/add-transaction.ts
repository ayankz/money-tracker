import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-add-transaction',
  imports: [Header],
  templateUrl: './add-transaction.html',
  styleUrl: './add-transaction.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTransaction {}
