import { Test, TestingModule } from '@nestjs/testing';
import { MonitorProcess } from './monitor.process';

describe('MonitorProcess', () => {
  let service: MonitorProcess;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitorProcess],
    }).compile();

    service = module.get<MonitorProcess>(MonitorProcess);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
