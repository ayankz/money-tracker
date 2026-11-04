import { TransactionType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOperationDto {
  @ApiPropertyOptional({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  readonly type?: TransactionType;

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly amount?: number;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  @IsNumber()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({ example: 'Updated from Swagger' })
  @IsOptional()
  @IsString()
  readonly comment?: string;

  @ApiPropertyOptional({ example: 2, nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  @IsNumber()
  readonly accountId?: number | null;
}
