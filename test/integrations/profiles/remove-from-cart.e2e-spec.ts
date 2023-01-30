import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { expect } from 'chai';
import { AccessRights } from '../../../src/shared/access.right';
import { itemStub } from '../../stubs/item.stubs';

describe('Remove from Cart', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let user: any;
  let item: any;
  let token: any;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;

  before(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();    
    await app.init();

    httpServer = app.getHttpServer();
    dbConnection = moduleFixture.get<DatabaseService>(DatabaseService).getConnection();
    redisCacheService = moduleFixture.get<RedisCacheService>(RedisCacheService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    fixture = new Fixture(dbConnection, redisCacheService, configService);
  });

  beforeEach(async () => {
    user = await fixture.createUser({ right: AccessRights.ADMIN });
    token = await fixture.login(user);
    item = await fixture.createItem();
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('items').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when items is not sent', async () => {        
    const response = await request(httpServer)
      .delete(`/profile/cart`)
      .set('token', token);     

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
  });

  it('should fail when no item is sent', async () => {        
    const response = await request(httpServer)
      .delete(`/profile/cart`)
      .set('token', token)
      .send({ items: [] }) 

      expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    });

  it('should fail when any item does not exist', async () => {       
    await request(httpServer)
      .put(`/profile/cart`)
      .set('token', token)
      .send({ items: [item._id] });

    const response = await request(httpServer)
      .delete(`/profile/cart`)
      .set('token', token)
      .send({ items: [item._id] });
  
      expect(response.status).to.equal(HttpStatus.OK);   
      expect(response.body.payload.length).equal(0);
    });
});