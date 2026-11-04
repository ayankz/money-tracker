import { inject, Injectable } from '@angular/core';
import {
  OperationsStore,
  type CreateOperationDto,
  type OperationOverviewRangeParams,
} from '../../store/operations.store';

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
  readonly overview = this.store.overview;
  readonly overviewRange = this.store.overviewRange;
  readonly isLoading = this.store.isLoading;
  readonly isOverviewLoading = this.store.isOverviewLoading;
  readonly isOverviewRangeLoading = this.store.isOverviewRangeLoading;
  readonly hasLoaded = this.store.hasLoaded;
  readonly hasOverviewLoaded = this.store.hasOverviewLoaded;
  readonly hasOverviewRangeLoaded = this.store.hasOverviewRangeLoaded;
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

  loadOperation(id: string | number): void {
    this.store.loadOperation(id);
  }

  loadOverview(): void {
    this.store.loadOverview();
  }

  loadOverviewRange(params: OperationOverviewRangeParams): void {
    this.store.loadOverviewRange(params);
  }

  createOperation(operation: CreateOperationDto): void {
    this.store.createOperation(operation);
  }

  deleteOperation(id: string | number): void {
    this.store.deleteOperation(id);
  }

  clearSelectedOperation(): void {
    this.store.clearSelectedOperation();
  }

  clearError(): void {
    this.store.clearError();
  }
}
