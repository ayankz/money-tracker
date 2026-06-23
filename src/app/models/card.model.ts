export interface Card {
  readonly id: number;
  readonly name?: string;
  readonly digits: string;
  readonly balance: number | string;
}

export interface CreateCardDto {
  readonly cardName: string;
  readonly digits: string;
  readonly balance: number;
}
