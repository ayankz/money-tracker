import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import type { Card, CreateCardDto } from '../models/card.model';
import { NotificationsService } from '../services/notifications/notifications';

interface CardsState {
  readonly cards: ReadonlyArray<Card>;
  readonly isLoading: boolean;
}

const initialState: CardsState = {
  cards: [],
  isLoading: false,
};

const API_URL = '/api/cards' as const;

function normalizeCard(card: Card): Card {
  return {
    ...card,
    balance: Number(card.balance),
  };
}

export const CardsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ cards }) => ({
    cardsCount: computed(() => cards().length),
    hasCards: computed(() => cards().length > 0),
    totalBalance: computed(() => cards().reduce((sum, card) => sum + Number(card.balance), 0)),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadCards: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() =>
            http.get<Card[]>(API_URL).pipe(
              tap((cards) =>
                patchState(store, {
                  cards: cards.map(normalizeCard),
                  isLoading: false,
                })
              ),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of([]);
              })
            )
          )
        )
      ),

      createCard: rxMethod<CreateCardDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((dto) =>
            http.post<Card>(API_URL, dto).pipe(
              tap((newCard) => {
                patchState(store, {
                  cards: [...store.cards(), normalizeCard(newCard)],
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of(null);
              })
            )
          )
        )
      ),

      deleteCard: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            http.delete<void>(`${API_URL}/${id}`).pipe(
              tap(() => {
                patchState(store, {
                  cards: store.cards().filter((card) => card.id !== id),
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of(null);
              })
            )
          )
        )
      ),
    };
  })
);
