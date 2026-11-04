import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { Prisma } from '@prisma/client';
import { mapPrismaError } from 'src/common/mappers/prisma-error.mapper';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(userId: number) {
    return await this.prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAccount(userId: number, dto: CreateAccountDto) {
    if (dto.type === 'CARD' && (!dto.cardName || !dto.digits)) {
      throw new BadRequestException(
        'cardName and digits are required for CARD account',
      );
    }

    try {
      return await this.prisma.account.create({
        data: {
          name: dto.name,
          type: dto.type,
          currency: dto.currency,
          cardName: dto.cardName,
          digits: dto.digits,
          userId,
          balance: new Prisma.Decimal(dto.balance),
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }
  async deleteAccount(accountId: number, userId: number) {
    const result = await this.prisma.account.updateMany({
      where: { id: accountId, userId, isArchived: false },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Account not found');
    }

    return { message: 'Account archived' };
  }
}
