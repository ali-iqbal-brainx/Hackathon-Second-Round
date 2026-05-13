import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let findAll: jest.Mock;

  beforeEach(async () => {
    findAll = jest.fn().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll returns an array', async () => {
    await expect(controller.findAll()).resolves.toEqual([]);
    expect(findAll).toHaveBeenCalled();
  });
});
