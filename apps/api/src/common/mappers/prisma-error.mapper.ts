import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function mapPrismaError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    throw new InternalServerErrorException('Internal server error');
  }

  switch (error.code) {
    case 'P2002':
      throw new ConflictException('Запись с такими данными уже существует');
    case 'P2003':
      throw new BadRequestException('Некорректные связанные данные');
    case 'P2025':
      throw new NotFoundException('Запись не найдена');
    default:
      throw new InternalServerErrorException('Database error');
  }
}
