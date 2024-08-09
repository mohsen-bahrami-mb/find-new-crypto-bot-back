import { Test, TestingModule } from '@nestjs/testing';
import { FinderTask } from './finder.task';

describe('FinderTask', () => {
  let service: FinderTask;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinderTask],
    }).compile();

    service = module.get<FinderTask>(FinderTask);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
