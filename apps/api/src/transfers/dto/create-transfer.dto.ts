import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  fromAccountId!: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  toAccountId!: number;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  debitAmount!: Decimal;

  @ApiProperty({ example: 20000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  creditAmount!: Decimal;

  @ApiPropertyOptional({ example: 'Write comment here' })
  @IsOptional()
  @IsString()
  comment?: string;
}
