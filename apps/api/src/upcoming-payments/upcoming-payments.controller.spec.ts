import { Test, TestingModule } from '@nestjs/testing';
import { UpcomingPaymentsController } from './upcoming-payments.controller';

describe('UpcomingPaymentsController', () => {
  let controller: UpcomingPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpcomingPaymentsController],
    }).compile();

    controller = module.get<UpcomingPaymentsController>(UpcomingPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
