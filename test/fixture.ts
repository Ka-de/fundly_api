import { Collection, Connection } from 'mongoose';
import { createUserStub } from './stubs/user.stubs';
import { v4 as uuidv4 } from 'uuid';
import { RedisCacheKeys } from '../src/redis-cache/redis-cache.keys';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';
import { User } from '../src/domains/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { Item } from '../src/domains/items/entities/item.entity';
import { createItemStub } from './stubs/item.stubs';
import { Order } from '../src/domains/orders/entities/order.entity';
import { createOrderStub } from './stubs/order.stubs';
import { OrderItemSchema } from '../src/shared/order.item.schema';
import { OrderState } from "../src/shared/order.state";

export class Fixture {
  readonly userCollection: Collection;
  readonly itemCollection: Collection;
  readonly orderCollection: Collection;

  readonly password = '12345';

  constructor(
    private connection: Connection,
    private redisCacheService: RedisCacheService,
    private configService: ConfigService
  ) {
    this.userCollection = this.connection.collection('users');
    this.itemCollection = this.connection.collection('items');
    this.orderCollection = this.connection.collection('orders');
  }

  async createUser(data: Partial<User> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.userCollection.insertOne({ ...createUserStub, ...data, _id: id as any, createdAt, updatedAt, hidden: false });
    const user = await this.userCollection.findOne({ _id: id });

    return user;
  }

  async requestPassword(email: string) {
    const key = `${RedisCacheKeys.AUTH_PASS}:${email}`;
    await this.redisCacheService.set(key, this.password, 5 * 60);

    const code = await this.redisCacheService.get(`${RedisCacheKeys.AUTH_PASS}:${email}`);
  }

  async login(user: { _id: string, email: string}) {
    await this.requestPassword(user.email);
    const token = sign(user._id, this.configService.get('SECRET'));
    return token;
  }

  async createItem(data: Partial<Item> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await this.itemCollection.insertOne({ ...createItemStub, ...data, _id: id as any, createdAt, updatedAt, hidden: false });
    const item = await this.itemCollection.findOne({ _id: id });

    return item;
  }

  async createOrder(user: User, items: Item[], data: Partial<Order> = {}){
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();    

    const orderItems = items.map(item => ({
      _id: item._id,
      price: item.price,
      quantity: 4
    } as OrderItemSchema));

    await this.orderCollection.insertOne({
      ...createOrderStub(orderItems), 
      status: OrderState.ORDERED,
      totalCost: 5000, 
      ...data, 
      userId: user._id, 
      _id: id as any, 
      createdAt, 
      updatedAt
    });
    const order = await this.orderCollection.findOne({ _id: id });
    return order;
  }
}
