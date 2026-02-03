import { inject, Injectable } from '@angular/core';
import { OperationsStore, type CreateOperationDto } from '../../store/operations.store';

/**
 * Facade service for operations management.
 * Provides a simplified API over the OperationsStore.
 * For direct store access, inject OperationsStore instead.
 */
@Injectable({
  providedIn: 'root',
})
export class OperationsService {
  private readonly store = inject(OperationsStore);

  readonly operations = this.store.operations;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly selectedOperation = this.store.selectedOperation;
  readonly operationsCount = this.store.operationsCount;
  readonly totalIncome = this.store.totalIncome;
  readonly totalExpense = this.store.totalExpense;
  readonly balance = this.store.balance;
  readonly hasOperations = this.store.hasOperations;

  loadOperations(): void {
    this.store.loadOperations();
  }

  loadOperation(id: string): void {
    this.store.loadOperation(id);
  }

  createOperation(operation: CreateOperationDto): void {
    this.store.createOperation(operation);
  }

  deleteOperation(id: string): void {
    this.store.deleteOperation(id);
  }

  clearSelectedOperation(): void {
    this.store.clearSelectedOperation();
  }

  clearError(): void {
    this.store.clearError();
  }
}
