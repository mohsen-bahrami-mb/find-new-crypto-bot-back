import { Test, TestingModule } from '@nestjs/testing';
import { FinderService } from './finder.service';

describe('FinderService', () => {
  let service: FinderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinderService],
    }).compile();

    service = module.get<FinderService>(FinderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
