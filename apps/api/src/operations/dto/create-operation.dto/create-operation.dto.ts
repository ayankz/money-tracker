import { TransactionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOperationDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 1250.5 })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : value))
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'Products' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : value))
  @Type(() => Number)
  @IsNumber()
  accountId?: number;
}
