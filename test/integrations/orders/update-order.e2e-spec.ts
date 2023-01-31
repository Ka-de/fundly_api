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
import { OrderState } from '../../../src/shared/order.state';

describe('Update Item', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let user = null;
  let token: string;
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
    fixture = new Fixture(dbConnection, redisCacheService, configService, );
  });

  beforeEach(async () => {
    user = await fixture.createUser({ right: AccessRights.ADMIN });
    token = await fixture.login(user);
    item = await fixture.createItem();
    order = await fixture.createOrder(user, [item]);
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

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .patch(`/orders/${1}`)
      .set('token', token);
      
    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when order is not found', async () => {   
    const id = order._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .patch(`/orders/${id}`)
      .set('token', token);

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Order not found'
    });
  });

  it('should fail when the status is not valid', async () => {        
    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .set('token', token)
      .send({ status: 'Ten' })

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"status" must be one of [ORDERED, CANCLED, PROCESSING, IN_TRANSIT, DELIVERED]'
    });
  });

  it('should fail when payment is provided without platform', async () => {
    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .set('token', token)
      .send({ payment: {} });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"payment.platform" is required'
    });
  });

  it('should fail when invalid payment platform is provided', async () => {
    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .set('token', token)
      .send({ payment: { platform: 'Platform'} });

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);  
    expect(response.body).to.deep.include({
      success: false,
      message: '"payment.platform" must be one of [BANK, CARD, CASH]'
    });
  });

  it('should update the order', async () => {    
    const orderItem = { _id: item._id, price: item.price, quantity: 4 };
    const { payment } = createOrderStub([orderItem]);

    const response = await request(httpServer)
      .patch(`/orders/${order._id}`)
      .set('token', token)
      .send({ payment, status: OrderState.DELIVERED  });

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.payload).to.deep.include({
      ...orderStub(user._id, [orderItem]),
      payment,
      status: OrderState.DELIVERED
    });
  });
});
