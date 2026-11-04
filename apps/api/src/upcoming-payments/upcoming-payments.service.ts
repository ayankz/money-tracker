import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UpcomingPayment } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUpcomingPaymentDto } from './dto/create-upcoming-payments.dto/create-upcoming-payments.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UpcomingPaymentsService {
  constructor(private prisma: PrismaService) { }

  async createUpcomingPayment(
    userId: number,
    dto: CreateUpcomingPaymentDto,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.upcomingPayment.create({
      data: {
        title: dto.title,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
        categoryId: dto.categoryId,
        comment: dto.comment,
        isActive: dto.isActive ?? true,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async getUpcomingPayments(userId: number) {
    return this.prisma.upcomingPayment.findMany({
      where: { userId, isActive: true },
      orderBy: { nextDueDate: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async archiveUpcomingPayment(id: number, userId: number) {
    const result = await this.prisma.upcomingPayment.updateMany({
      where: {
        id,
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Upcoming payment not found');
    }

    return { message: 'Upcoming payment archived' };
  }

  @Cron('0 1 * * *')
  async updateUpcomingPaymentsSchedule() {
    const now = new Date();

    const payments = await this.prisma.upcomingPayment.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: now },
      },
    });

    for (const payment of payments) {
      const nextDueDate = this.getNextDueDate(payment);

      await this.prisma.upcomingPayment.update({
        where: { id: payment.id },
        data: { nextDueDate },
      });
    }
  }

  private getNextDueDate(payment: UpcomingPayment) {
    const next = new Date(payment.nextDueDate);
    const now = new Date();

    while (next <= now) {
      if (payment.frequency === 'WEEKLY') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next;
  }
}
