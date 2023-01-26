import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../../mail/mail.service';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';
import { SortEnum } from '../../shared/sort.enum';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item, ItemDocument } from './entities/item.entity';
import { ItemResponse } from './responses/item.response';
import { ListItemsResponse } from './responses/list-items.response';
import { Storage } from '../../shared/storage';

@Injectable()
export class ItemsService {
  storage = new Storage();

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private redisCacheService: RedisCacheService
  ){}

  async createItem(
    createItemDto: CreateItemDto
  ) {
    const model = await this.itemModel.create(createItemDto);
    const item = await this.getItem(model._id as string);

    return item;
  }

  async listItems(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    query = ''
  ) {
    const items = await this.itemModel.find({
      hidden: false,
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { tags: new RegExp(query, 'i') }
      ]
    })
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);

    return { success: true, payload: items.map(item => Item.toResponse(item)) } as ListItemsResponse;
  }

  async getItem(
    id: string
  ) {        
    let item = await this.redisCacheService.get<Item>(`${RedisCacheKeys.GET_USER}:${id}`);

    item = item ? item : await this.itemModel.findOne({ _id: id, hidden: false });   
     
    if(!item){
      throw new NotFoundException('Item not found');
    }
    return { success: true, payload: Item.toResponse(item) } as ItemResponse;
  }

  async updateItem(
    id: string, 
    updateItemDto: UpdateItemDto
  ) {
    const item = await this.getItem(id);
    await this.itemModel.findOneAndUpdate({ _id: id }, updateItemDto);
    
    return { success: true, payload: { ...item.payload, ...updateItemDto }} as ItemResponse;
  }

  async removeItem(
    id: string
  ) {
    await this.getItem(id);
    await this.itemModel.findOneAndUpdate({ _id: id }, { hidden: true });

    return { success: true };
  }

  async wishlistItem(
    id: string,
    user: string
  ){
    const item = await this.getItem(id);
    await this.itemModel.findOneAndUpdate({ _id: id }, { $push: { wishlistedBy: user }});
    
    return { success: true, payload: { ...item.payload, ['wishlistedBy']: [...item.payload['wishlistedBy'], user] }} as ItemResponse;
  }

  async unWishlistItem(
    id: string,
    user: string
  ){
    const item = await this.getItem(id);
    await this.itemModel.findOneAndUpdate({ _id: id }, { $pull: { wishlistedBy: user }});

    const wishlistedBy = item.payload['wishlistedBy'].filter((w: string) => w === user);
    return { success: true, payload: { ...item.payload, wishlistedBy }} as ItemResponse;
  }

  async uploadItemImages(
    id: string, 
    files: any[], 
  ){    
    await this.getItem(id);
    const images = await Promise.all(files.map(async (file) => {
      const temp = [file.destination, file.filename].join('/');    
      return await this.storage.move(temp, ['items', id].join('/'), file.filename);
    }));

    const item = await this.itemModel.findOneAndUpdate({ _id: id }, {
      $push: { images }
    });

    return { success: true, payload: [...item.get('images'), ...images] };
  }

  async removeItemImages(
    id: string, 
    files: any[], 
  ){    
    const item = await this.getItem(id);
    await Promise.all(files.map(async (file) => {
      await this.storage.delete(file);
    }));

    await this.itemModel.findOneAndUpdate({ _id: id }, {
      $pull: { images: { $in: files } }
    });

    const images = item.payload['images'].filter((i: string) => files.includes(i));
    return { success: true, payload: images};
  }
}
