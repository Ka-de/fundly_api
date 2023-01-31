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
import { createOrderStub, orderStub } from '../../stubs/order.stubs';

describe('Create Order', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService
  let user: any;
  let token: any;
  let item: any;
  let order: any;
  
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
    await dbConnection.collection('orders').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when items is not provided', async () => {
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({});    

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"items" is required'
    })  
  });

  it('should fail when quantity of an item is not provided', async () => {
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items: [{ _id: item._id }] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"items[0].quantity" is required'
    })  
  });

  it('should fail when price of an item is not provided', async () => {
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items: [{ _id: item._id, quantity: item.quantity }] });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"items[0].price" is required'
    })  
  });

  it('should fail when delivery is not provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 }
    const { items } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery" is required'
    })  
  });

  it('should fail when delivery pickup is not provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery: {} });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.pickup" is required'
    })  
  });

  it('should fail when invalid delivery pickup is provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery: { pickup: 'A pick' } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.pickup" must be one of [STATION, HOME]'
    })  
  });

  it('should fail when delivery address is not provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery: { pickup: delivery.pickup } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.address" is required'
    })  
  });

  it('should fail when delivery phone is not provided or invalid', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery: { pickup: delivery.pickup, address: delivery.address } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.phone" must be a valid phone number'
    })  
  });

  it('should fail when delivery cost is not provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery: { pickup: delivery.pickup, address: delivery.address, phone: delivery.phone } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"delivery.cost" is required'
    });
  });

  it('should fail when payment is provided without platform', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery, payment: {} });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"payment.platform" is required'
    });
  });

  it('should fail when invalid payment platform is provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const { items, delivery } = createOrderStub([orderItem]);
    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({ items, delivery, payment: { platform: 'Platform' } });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"payment.platform" must be one of [BANK, CARD, CASH]'
    });
  });

  it('should succeed when valid data is provided', async () => {
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };

    const response = await request(httpServer)
      .post('/orders')
      .set('token', token)
      .send({...createOrderStub([orderItem])});      

    expect(response.status).to.equal(HttpStatus.CREATED); 
    expect(response.body.success).to.equal(true);                           
    expect(response.body.payload).to.deep.include(orderStub(user._id, [orderItem]));
  });
});