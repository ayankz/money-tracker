import { Test, TestingModule } from '@nestjs/testing';
import { UpcomingPaymentsService } from './upcoming-payments.service';

describe('UpcomingPaymentsService', () => {
  let service: UpcomingPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpcomingPaymentsService],
    }).compile();

    service = module.get<UpcomingPaymentsService>(UpcomingPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
