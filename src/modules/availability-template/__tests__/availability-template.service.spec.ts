import { IIdentity } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'aws-sdk';
import { AVAILABILITY_TEMPLATE_REPOSITORY, SEQUELIZE } from 'common/constants';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { Sequelize } from 'sequelize/types';
// import { createDB, dropDB, migrateDB } from 'utils/test-helpers/DatabaseHelpers';
import { AvailabilityTemplateModule } from '../availability-template.module';
import { AvailabilityTemplateService } from '../availability-template.service';
import { AvailabilitySlotDto } from '../dto/availability-template-slot.dto';
import { AvailabilityTemplateDto } from '../dto/availability-template.dto';
import { AvailabilityTemplateModel } from '../model/availability-template.model';

jest.setTimeout(10_000_000);
describe('AvailabilityTemplateService', () => {
  let service: AvailabilityTemplateService;
  let module: TestingModule;
  let db: Sequelize;
  let repo: typeof AvailabilityTemplateModel;
  let config;
  let mockSlots: AvailabilitySlotDto[];
  let mockDto: AvailabilityTemplateDto;

  let identity: IIdentity;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AvailabilityTemplateModule, ConfigurationModule, DatabaseModule],
    }).compile();

    service = module.get<AvailabilityTemplateService>(AvailabilityTemplateService);
    // await dropDB();
    // await createDB();
    // await migrateDB();
    db = await module.get(SEQUELIZE);
    repo = await module.get<typeof AvailabilityTemplateModel>(AVAILABILITY_TEMPLATE_REPOSITORY);
    config = await module.get<ConfigService>('ConfigService');
  });

  afterAll((done) => {
    db.close();
    module.close();
    done();
  });

  beforeEach(async () => {
    await repo.destroy({ where: {} });
    identity = {
      clinicId: 100,
      userId: 100,
      cognitoId: null,
      userInfo: null,
      userLang: 'en',
    };
    mockSlots = [
      {
        appointmentTypeId: 1,
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        durationMinutes: 30,
        startTime: '12:00',
      },
      {
        appointmentTypeId: 2,
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        durationMinutes: 30,
        startTime: '11:30',
      },
    ];
    mockDto = {
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      name: "Dr. Khaled's Typical Wednesday",
      availabilitySlots: mockSlots,
    };
  });

  describe('Service', () => {
    it('Should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Database Connection', () => {
    it('Access test database', () => {
      expect(db).toBeDefined();
      expect(db.getDatabaseName()).toBe(config.get('database').database);
    });
    it('Access service table', () => {
      expect(repo.getTableName()).toBe('AvailabilityTemplate');
    });
  });

  describe('#createAvailabilityTemplate', () => {
    // Success case
    it('Creates an entry in database with valid dto', async () => {
      const obj = await service.createAvailabilityTemplate(mockDto);
      expect(obj.name).toBe(mockDto.name);
      expect(obj.availabilitySlots.length).toBe(mockSlots.length);
    });
    // Failing cases
    // Rest of validation is done through pipes in controller
    it('Fails if appointment type not valid', async () => {
      mockSlots[0].appointmentTypeId = 100;
      await expect(service.createAvailabilityTemplate(mockDto)).rejects.toThrow(/type/);
    });
  });

  describe('#getAvailabilityTemplateByName', () => {
    // Create templates to search for
    const populateDatabase = async () => {
      // 1. Dr. Khaled
      await service.createAvailabilityTemplate(mockDto);

      // 2. Dr. Khaled 2
      mockDto.name += ' 2';
      await service.createAvailabilityTemplate(mockDto);

      // 3. Dr Ehab
      mockDto.name = "Dr. Ehab's Typical Monday";
      await service.createAvailabilityTemplate(mockDto);

      // Different clinic
      const mockDto2 = { ...mockDto };
      mockDto2.clinicId = 200;
      mockDto2.name = "Dr. Raji's Typical Monday";
      await service.createAvailabilityTemplate(mockDto2);
    };
    it('Searches succesfully providing key (case insensitive)', async () => {
      await populateDatabase();
      const res = await service.getAvailabilityTemplatesByName(identity.clinicId, 'typical');
      expect(res).toHaveLength(3);
      expect(res[0].name).toMatch('Khaled');
      expect(res[1].name).toMatch('2');
      expect(res[2].name).toMatch('Ehab');
    });
    it('Returns all templates provided no key', async () => {
      await populateDatabase();
      const res = await service.getAvailabilityTemplatesByName(identity.clinicId);
      expect(res).toHaveLength(3);
      expect(res[2].name).toMatch('Typical');
    });
  });

  describe('#deleteAvailabiltyTemplatesByIds', () => {
    // Create templates to search for
    const ids = [];
    const populateDatabase = async () => {
      ids.push((await service.createAvailabilityTemplate(mockDto)).id);
      ids.push((await service.createAvailabilityTemplate(mockDto)).id);
      ids.push((await service.createAvailabilityTemplate(mockDto)).id);
    };
    it('Succesfully deletes and cascades an entry provided id', async () => {
      await populateDatabase();
      await expect(repo.count({ where: {} })).resolves.toBe(3);
      await expect(service.deleteAvailabilityTemplatesByIds(ids)).resolves.not.toThrow();
      await expect(repo.count({ where: {} })).resolves.toBe(0);
    });
    it('Fails providing no key', async () => {
      await expect(service.deleteAvailabilityTemplatesByIds(undefined)).rejects.toThrow(/ids/);
    });
    it('Fails providing empty key', async () => {
      await expect(service.deleteAvailabilityTemplatesByIds([])).rejects.toThrow(/ids/);
    });
  });
});
