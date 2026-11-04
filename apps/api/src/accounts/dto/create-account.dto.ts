import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { AccountType, Currency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty({ example: 'Account name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CARD })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ enum: Currency, example: Currency.KZT })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ example: 15000.5 })
  @Type(() => Number)
  @IsNumber()
  balance!: number;

  @ApiPropertyOptional({ example: 'Kaspi Gold' })
  @IsOptional()
  @IsString()
  cardName?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  digits?: string;
}
