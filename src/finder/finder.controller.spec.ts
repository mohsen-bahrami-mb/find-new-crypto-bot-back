import { Test, TestingModule } from '@nestjs/testing';
import { FinderController } from './finder.controller';

describe('FinderController', () => {
  let controller: FinderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinderController],
    }).compile();

    controller = module.get<FinderController>(FinderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
