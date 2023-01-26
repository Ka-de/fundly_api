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
import { createitemStub, itemStub } from '../../stubs/item.stubs';

describe('Create Item', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService
  let user: any;
  let token: any;
  
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

  it('should fail when no title is provided', async () => {
    const response = await request(httpServer)
      .post('/items')
      .set('token', token)
      .send({});    

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"title" is required'
    })  
  });

  it('should fail when no price is provided', async () => {
    const { title } = createitemStub;
    const response = await request(httpServer)
      .post('/items')
      .set('token', token)
      .send({ title });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"price" is required'
    })  
  });

  it('should fail when invalid price is provided', async () => {
    const { title } = createitemStub;
    const response = await request(httpServer)
      .post('/items')
      .set('token', token)
      .send({ title, price: 'abc' });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"price" must be a number'
    })  
  });

  it('should fail when title is taken', async () => {
    await fixture.createItem();

    const response = await request(httpServer)
      .post('/items')
      .set('token', token)
      .send({ ...createitemStub });    

    expect(response.status).to.equal(HttpStatus.CONFLICT);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"title" is already in use'
    });
  });

  it('should succeed when valid data is provided', async () => {
    const response = await request(httpServer)
      .post('/items')
      .set('token', token)
      .send({...createitemStub});      

    expect(response.status).to.equal(HttpStatus.CREATED); 
    expect(response.body.success).to.equal(true);                           
    expect(response.body.payload).to.deep.include(itemStub);
  });
});