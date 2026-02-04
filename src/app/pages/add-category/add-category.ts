import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-add-category',
  imports: [Header],
  templateUrl: './add-category.html',
  styleUrl: './add-category.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCategory {}
