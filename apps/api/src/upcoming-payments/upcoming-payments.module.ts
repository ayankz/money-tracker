import { Module } from '@nestjs/common';
import { UpcomingPaymentsService } from './upcoming-payments.service';
import { UpcomingPaymentsController } from './upcoming-payments.controller';

@Module({
  providers: [UpcomingPaymentsService],
  controllers: [UpcomingPaymentsController]
})
export class UpcomingPaymentsModule {}
