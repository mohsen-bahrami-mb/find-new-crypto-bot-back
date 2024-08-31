import { Test, TestingModule } from '@nestjs/testing';
import { FileGeneratorController } from './file-generator.controller';

describe('FileGeneratorController', () => {
  let controller: FileGeneratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileGeneratorController],
    }).compile();

    controller = module.get<FileGeneratorController>(FileGeneratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
