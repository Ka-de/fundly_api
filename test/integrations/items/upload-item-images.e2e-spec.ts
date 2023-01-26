import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { Storage } from '../../../src/shared/storage';
import { expect } from 'chai';
import { AccessRights } from '../../../src/shared/access.right';

describe('Upload Item Images', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let user = null;
  let token: string;
  let item = null;

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
    fixture = new Fixture(dbConnection, redisCacheService, configService, );
  });

  beforeEach(async () => {
    user = await fixture.createUser({ right: AccessRights.ADMIN });
    item = await fixture.createItem();
    token = await fixture.login(user);
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('items').deleteMany({});
  });

  after(async () => {
    Storage.reset();
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
    .put(`/items/1/images`)
    .attach('images', './test/sample.png')
    .set('token', token)
    .set('Content-Type', 'multipart/form-data');

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when item is not found', async () => {   
    const id = item._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
    .put(`/items/${id}/images`)
    .attach('images', './test/sample.png')
    .set('token', token)
    .set('Content-Type', 'multipart/form-data');
 

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Item not found'
    });
  });

  it('should fail when no images is sent', async () => {    
    const response = await request(httpServer)
      .put(`/items/${item._id}/images`)
      .set('token', token);    

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"files" are not valid'
    });
  });

  it('should fail when excess images are sent', async () => {    
    const response = await request(httpServer)
      .put(`/items/${item._id}/images`)
      .attach('images', './test/sample.png')
      .attach('images', './test/sample.png')
      .attach('images', './test/sample.png')
      .attach('images', './test/sample.png')
      .attach('images', './test/sample.png')
      .attach('images', './test/sample.png')
      .set('token', token)
      .set('Content-Type', 'multipart/form-data');    

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
    });
  });

  it('should succeed when valid data is sent', async () => {    
    const response = await request(httpServer)
    .put(`/items/${item._id}/images`)
    .attach('images', './test/sample.png')
    .attach('images', './test/sample.png')
    .set('token', token)
    .set('Content-Type', 'multipart/form-data');

    expect(response.status).to.equal(HttpStatus.OK);          
    expect(response.body).to.deep.include({
      success: true
    });    
    expect(response.body.payload.length).to.equal(2);
  });
});