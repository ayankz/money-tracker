import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import { NotificationsService } from '../services/notifications/notifications';
import { ICON_OPTIONS } from '../constants/icon-options';
import type { Category, CategoryType, CreateCategoryDto } from '../types/category.types';

interface ApiCategory {
  readonly id: string | number;
  readonly name: string;
  readonly type: CategoryType;
}

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
const DEFAULT_ICON_ID = 'home' as const;
const DEFAULT_ICON_COLOR = '#994ce6' as const;
const DEFAULT_BACKGROUND_COLOR = '#ffdce3' as const;

function getIconPath(iconId?: string): string {
  return ICON_OPTIONS.find((icon) => icon.id === iconId)?.path
    ?? ICON_OPTIONS.find((icon) => icon.id === DEFAULT_ICON_ID)?.path
    ?? 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';
}

function normalizeCategory(category: ApiCategory): Category {
  const iconId = DEFAULT_ICON_ID;

  return {
    id: String(category.id),
    name: category.name,
    type: category.type,
    iconId,
    iconPath: getIconPath(iconId),
    iconColor: DEFAULT_ICON_COLOR,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
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
            http.get<ApiCategory[]>(API_URL).pipe(
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
            http.post<ApiCategory>(API_URL, dto).pipe(
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
