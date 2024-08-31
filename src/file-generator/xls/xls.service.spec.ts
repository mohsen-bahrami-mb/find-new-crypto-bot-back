import { Test, TestingModule } from '@nestjs/testing';
import { XlsService } from './xls.service';

describe('XlsService', () => {
  let service: XlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsService],
    }).compile();

    service = module.get<XlsService>(XlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
