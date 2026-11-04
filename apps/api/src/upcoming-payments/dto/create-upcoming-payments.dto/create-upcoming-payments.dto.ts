import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, Frequency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUpcomingPaymentDto {
  @ApiProperty({ example: 'Rent' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 1200 })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: Currency, example: Currency.NZD })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ enum: Frequency, example: Frequency.WEEKLY })
  @IsEnum(Frequency)
  frequency!: Frequency;

  @ApiProperty({ example: '2026-07-25T00:00:00.000Z' })
  @IsDateString()
  nextDueDate!: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsNumber()
  categoryId!: number;

  @ApiPropertyOptional({ example: 'Pay before landlord reminder' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
