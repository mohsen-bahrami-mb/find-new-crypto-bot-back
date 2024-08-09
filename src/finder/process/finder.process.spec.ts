import { Test, TestingModule } from '@nestjs/testing';
import { FinderProcess } from './finder.process';

describe('FinderProcess', () => {
  let service: FinderProcess;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinderProcess],
    }).compile();

    service = module.get<FinderProcess>(FinderProcess);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
