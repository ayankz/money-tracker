export interface Account {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly currency: string;
  readonly cardName?: string;
  readonly digits: string;
  readonly balance: number | string;
}

export interface CreateAccountDto {
  readonly name: string;
  readonly type: string;
  readonly currency: string;
  readonly cardName?: string;
  readonly digits?: string;
  readonly balance: number;
}
