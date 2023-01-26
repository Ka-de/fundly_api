import { Collection, Connection } from 'mongoose';
import { createUserStub } from './stubs/user.stubs';
import { v4 as uuidv4 } from 'uuid';
import { RedisCacheKeys } from '../src/redis-cache/redis-cache.keys';
import { RedisCacheService } from '../src/redis-cache/redis-cache.service';
import { User } from '../src/domains/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { Item } from '../src/domains/items/entities/item.entity';
import { createitemStub } from './stubs/item.stubs';
export class Fixture {
  readonly userCollection: Collection;
  readonly itemCollection: Collection;

  readonly password = '12345';

  constructor(
    private connection: Connection,
    private redisCacheService: RedisCacheService,
    private configService: ConfigService
  ) {
    this.userCollection = this.connection.collection('users');
    this.itemCollection = this.connection.collection('items');
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

    await this.itemCollection.insertOne({ ...createitemStub, ...data, _id: id as any, createdAt, updatedAt, hidden: false });
    const item = await this.itemCollection.findOne({ _id: id });

    return item;
  }
}
