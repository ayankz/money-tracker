import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOperationDto } from './dto/create-operation.dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto/update-operation.dto';
import {
  OperationsOverviewRangeQueryDto,
} from './dto/operations-overview-range-query.dto/operations-overview-range-query.dto';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: number, dto: CreateOperationDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertAccountOwnership(tx, dto.accountId, userId);
      await this.assertCategoryCompatibility(tx, dto.categoryId, dto.type);

      const transaction = await tx.transaction.create({
        data: {
          ...dto,
          userId,
        },
      });

      await this.applyAccountBalanceChange(
        tx,
        dto.accountId,
        this.getSignedAmount(dto.type, dto.amount),
      );

      return transaction;
    });
  }

  async findAll(userId: number) {
    return await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        account: {
          select: {
            name: true,
            type: true,
            currency: true,
            digits: true,
          },
        },
      },
    });
  }

  async getOverview(userId: number) {
    const weekRange = this.getWeekRange();
    const monthRange = this.getMonthRange();

    return {
      week: await this.buildOverview(userId, weekRange.from, weekRange.to),
      month: await this.buildOverview(userId, monthRange.from, monthRange.to),
    };
  }

  async getOverviewByRange(
    userId: number,
    query: OperationsOverviewRangeQueryDto,
  ) {
    const { from, to } = this.resolveCustomRange(query);

    return this.buildOverview(userId, from, to);
  }

  private async buildOverview(userId: number, from: Date, to: Date) {

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        accountId: { not: null },
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        type: true,
        amount: true,
        account: {
          select: {
            currency: true,
          },
        },
      },
    });

    const totals = Object.values(Currency).map((currency) => ({
      currency,
      income: 0,
      expense: 0,
    }));

    for (const transaction of transactions) {
      const currency = transaction.account?.currency;

      if (!currency) {
        continue;
      }

      const currencyTotals = totals.find((item) => item.currency === currency);

      if (!currencyTotals) {
        continue;
      }

      if (transaction.type === 'INCOME') {
        currencyTotals.income += transaction.amount;
      } else {
        currencyTotals.expense += transaction.amount;
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totals,
    };
  }

  async findOne(id: number, userId: number) {
    return this.prisma.transaction.findFirst({
      where: { id, userId },
    });
  }

  async update(id: number, userId: number, dto: UpdateOperationDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: { id, userId },
      });

      if (!existingTransaction) {
        throw new ForbiddenException('Access denied or transaction not found');
      }

      const nextType = dto.type ?? existingTransaction.type;
      const nextAmount = dto.amount ?? existingTransaction.amount;
      const nextCategoryId =
        dto.categoryId === undefined
          ? existingTransaction.categoryId
          : dto.categoryId;
      const nextAccountId =
        dto.accountId === undefined ? existingTransaction.accountId : dto.accountId;

      await this.assertAccountOwnership(tx, nextAccountId, userId);
      await this.assertCategoryCompatibility(tx, nextCategoryId, nextType);

      await tx.transaction.update({
        where: { id: existingTransaction.id },
        data: dto,
      });

      await this.syncAccountBalancesAfterUpdate(tx, existingTransaction, {
        type: nextType,
        amount: nextAmount,
        accountId: nextAccountId,
      });

      return { message: 'Transaction updated' };
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: { id, userId },
      });

      if (!existingTransaction) {
        throw new ForbiddenException('Access denied or transaction not found');
      }

      await tx.transaction.delete({
        where: { id: existingTransaction.id },
      });

      await this.applyAccountBalanceChange(
        tx,
        existingTransaction.accountId,
        -this.getSignedAmount(
          existingTransaction.type,
          existingTransaction.amount,
        ),
      );

      return { message: 'Transaction deleted' };
    });
  }

  private async assertAccountOwnership(
    tx: Prisma.TransactionClient,
    accountId: number | null | undefined,
    userId: number,
  ) {
    if (accountId == null) {
      return;
    }

    const account = await tx.account.findFirst({
      where: { id: accountId, userId, isArchived: false },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }
  }

  private async assertCategoryCompatibility(
    tx: Prisma.TransactionClient,
    categoryId: number | null | undefined,
    type: TransactionType,
  ) {
    if (categoryId == null) {
      return;
    }

    const category = await tx.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.type !== type) {
      throw new ForbiddenException(
        'Category type does not match transaction type',
      );
    }
  }

  private async syncAccountBalancesAfterUpdate(
    tx: Prisma.TransactionClient,
    existingTransaction: {
      type: TransactionType;
      amount: number;
      accountId: number | null;
    },
    nextTransaction: {
      type: TransactionType;
      amount: number;
      accountId: number | null;
    },
  ) {
    const previousSignedAmount = this.getSignedAmount(
      existingTransaction.type,
      existingTransaction.amount,
    );
    const nextSignedAmount = this.getSignedAmount(
      nextTransaction.type,
      nextTransaction.amount,
    );

    if (existingTransaction.accountId === nextTransaction.accountId) {
      await this.applyAccountBalanceChange(
        tx,
        nextTransaction.accountId,
        nextSignedAmount - previousSignedAmount,
      );
      return;
    }

    await this.applyAccountBalanceChange(
      tx,
      existingTransaction.accountId,
      -previousSignedAmount,
    );
    await this.applyAccountBalanceChange(
      tx,
      nextTransaction.accountId,
      nextSignedAmount,
    );
  }

  private async applyAccountBalanceChange(
    tx: Prisma.TransactionClient,
    accountId: number | null | undefined,
    signedAmount: number,
  ) {
    if (accountId == null || signedAmount === 0) {
      return;
    }

    if (signedAmount < 0) {
      const account = await tx.account.findUnique({
        where: { id: accountId },
      });

      if (!account || account.isArchived) {
        throw new NotFoundException('Account not found');
      }

      const debitAmount = new Prisma.Decimal(Math.abs(signedAmount));

      if (account.balance.lessThan(debitAmount)) {
        throw new BadRequestException('Insufficient funds in the account');
      }
    }

    await tx.account.update({
      where: { id: accountId },
      data: {
        balance:
          signedAmount > 0
            ? { increment: signedAmount }
            : { decrement: Math.abs(signedAmount) },
      },
    });
  }

  private getSignedAmount(type: TransactionType, amount: number) {
    return type === 'INCOME' ? amount : -amount;
  }

  private resolveCustomRange(query: OperationsOverviewRangeQueryDto) {
    const { dateFrom, dateTo } = query;

    if (!dateFrom || !dateTo) {
      throw new BadRequestException(
        'dateFrom and dateTo are required for a custom range',
      );
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    if (from > to) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    return { from, to };
  }

  private getWeekRange() {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(now.getDate() - 6);

    return { from, to };
  }

  private getMonthRange() {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(1);

    return { from, to };
  }
}
