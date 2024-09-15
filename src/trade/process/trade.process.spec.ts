import { Test, TestingModule } from '@nestjs/testing';
import { TradeProcess } from './trade.process';

describe('TradeProcess', () => {
  let provider: TradeProcess;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradeProcess],
    }).compile();

    provider = module.get<TradeProcess>(TradeProcess);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
