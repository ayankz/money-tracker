import { inject, Injectable } from '@angular/core';
import { TransfersStore, type CreateTransferDto } from '../../store/transfers.store';

@Injectable({
  providedIn: 'root',
})
export class TransfersService {
  private readonly store = inject(TransfersStore);

  readonly transfers = this.store.transfers;
  readonly selectedTransfer = this.store.selectedTransfer;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly transfersCount = this.store.transfersCount;
  readonly hasTransfers = this.store.hasTransfers;

  loadTransfers(): void {
    this.store.loadTransfers();
  }

  createTransfer(dto: CreateTransferDto): void {
    this.store.createTransfer(dto);
  }

  clearSelectedTransfer(): void {
    this.store.clearSelectedTransfer();
  }

  clearError(): void {
    this.store.clearError();
  }
}
