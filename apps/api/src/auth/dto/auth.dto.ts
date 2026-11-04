import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SigninDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  password!: string;
}

export class SignupDto extends SigninDto {
  @MinLength(12)
  @MaxLength(72)
  declare password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class GoogleExchangeDto {
  @IsString()
  @Length(43, 43)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  password?: string;
}
