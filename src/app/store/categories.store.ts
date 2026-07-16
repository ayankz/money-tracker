import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import { NotificationsService } from '../services/notifications/notifications';
import type { ApiCategoryBase, Category, CategoryType, CreateCategoryDto } from '../types/category.types';

interface CategoriesState {
  readonly categories: ReadonlyArray<Category>;
  readonly selectedType: CategoryType;
  readonly isLoading: boolean;
}

const initialState: CategoriesState = {
  categories: [],
  selectedType: 'EXPENSE',
  isLoading: false,
};

const API_URL = '/api/category' as const;

function normalizeCategory(category: ApiCategoryBase): Category {
  return {
    id: String(category.id),
    name: category.name,
    type: category.type,
  };
}

export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ categories }) => ({
    categoriesCount: computed(() => categories().length),
    hasCategories: computed(() => categories().length > 0),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadCategories: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() =>
            http.get<ApiCategoryBase[]>(API_URL).pipe(
              tap((categories) =>
                patchState(store, {
                  categories: categories.map(normalizeCategory),
                  isLoading: false,
                })
              ),
              catchError(() => {
                patchState(store, { isLoading: false });
                return of([]);
              })
            )
          )
        )
      ),

      createCategory: rxMethod<CreateCategoryDto>(
        pipe(
          tap((dto) => patchState(store, { isLoading: true, selectedType: dto.type })),
          switchMap((dto) =>
            http.post<ApiCategoryBase>(API_URL, dto).pipe(
              tap((createdCategory) => {
                const normalized = normalizeCategory(createdCategory);
                patchState(store, {
                  categories: [...store.categories(), normalized],
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError(() => {
                patchState(store, { isLoading: false });
                return of(null);
              })
            )
          )
        )
      ),
    };
  })
);
