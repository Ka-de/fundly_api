import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';
import { MailEnum } from '../../mail/mail.enum';
import { MailService } from '../../mail/mail.service';
import { ResponseSchema } from '../../shared/response.schema';
import { SortEnum } from '../../shared/sort.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { UserResponse } from './responses/user.response';
import { Storage } from '../../shared/storage';
import { ItemsService } from '../items/items.service';

@Injectable()
export class UsersService {
  storage = new Storage();

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private redisCacheService: RedisCacheService,
    private itemsService: ItemsService
  ){}

  async findByEmail(email: string) {     
    let user = await this.redisCacheService.get(`${RedisCacheKeys.GET_USER}:${email}`);
    if (user) {
      return user;
    }

    user = await this.userModel.findOne({ email, hidden: false }) as User;    
    if(!user){
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findById(id: string) {     
    let user = await this.redisCacheService.get<User>(`${RedisCacheKeys.GET_USER}:${id}`);

    user = user ? user : await this.userModel.findOne({ _id: id, hidden: false });   
     
    if(!user){
      throw new NotFoundException('User not found');
    }
    
    return User.toResponse(user);
  }

  async createUser(createUserDto: CreateUserDto) {
    const model = await this.userModel.create(createUserDto);
    const user = await this.getUser(model._id as string);

    await this.mailService.sendMail({
      to: user.payload.email,
      subject: 'Registration Successful',
      template: MailEnum.VERIFY,
      context: {
        url: 'https://occupyapi.herokuapp.com/verify',
        name: user.payload.firstname
      }
    });    

    return user;
  }

  async listUsers(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    query = ''
  ) {
    const users = await this.userModel.find({
      hidden: false,
      $or: [
        { email: new RegExp(query, 'i') },
        { firstname: new RegExp(query, 'i') },
        { lastname: new RegExp(query, 'i') }
      ]
    })
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);
      
    return { success: true, payload: users.map(user => User.toResponse(user)) } as ResponseSchema<User[]>;
  }

  async getUser(id: string) {        
    const user = await this.findById(id); 
    return { success: true, payload: user } as UserResponse;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    await this.userModel.findOneAndUpdate({ _id: id }, updateUserDto);
    
    return { success: true, payload: { ...user, ...updateUserDto }} as UserResponse;
  }

  async removeUser(id: string) {
    await this.findById(id);
    await this.userModel.findOneAndUpdate({ _id: id }, { hidden: true });

    return { success: true };
  }

  async uploadImage(id: string, file: any){
    await this.findById(id);
    const temp = [file.destination, file.filename].join('/');    

    const image = await this.storage.move(temp, id, 'image.png');
    await this.userModel.findOneAndUpdate({ _id: id }, { image });

    return { success: true, payload: image };
  }

  async getCart(
    id: string
  ){
    const user = await this.findById(id);
    return { success: true, payload: user.cart } as ResponseSchema<String[]>;
  }

  async addToCart(
    id: string,
    items: string[]
  ) {
    for await (let item of items) {
      await this.itemsService.getItem(item);
    }

    const cart = (await this.getCart(id)).payload;
    await this.userModel.findOneAndUpdate({ _id: id }, { $addToSet: { cart: items }});
    const payload = Array.from(new Set([...cart, ...items]));

    return { success: true, payload } as ResponseSchema<String[]>;
  }

  async removeFromCart(
    id: string,
    items: string[]
  ) {
    const cart = (await this.getCart(id)).payload;
    await this.userModel.findOneAndUpdate({ _id: id }, { $pull: { cart: items }});
    const payload = cart.filter(c => items.includes(c as string))

    return { success: true, payload } as ResponseSchema<String[]>;
  }
}
