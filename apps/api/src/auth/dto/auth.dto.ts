import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty({ example: 'strong-password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
