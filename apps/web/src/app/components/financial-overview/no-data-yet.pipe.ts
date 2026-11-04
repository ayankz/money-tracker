import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'noDataYet',
  standalone: true,
})
export class NoDataYetPipe implements PipeTransform {
  transform(value: number | null | undefined): string | null {
    if (typeof value !== 'number' || value === 0) {
      return 'No data yet';
    }

    return null;
  }
}
