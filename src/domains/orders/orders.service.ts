import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../../mail/mail.service';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';
import { SortEnum } from '../../shared/sort.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './entities/order.entity';
import { ListOrdersResponse } from './responses/list-orders.response';
import { OrderResponse } from './responses/order.response';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private redisCacheService: RedisCacheService
  ){}
  
  async createOrder(
    createOrderDto: CreateOrderDto,
    user: string
  ) {
    const totalCost = createOrderDto.items.reduce((acc, red) => acc + (red.price * red.quantity), 0) + createOrderDto.delivery.cost;    

    const model = await this.orderModel.create({ ...createOrderDto, totalCost, userId: user });
    const order = await this.getOrder(model._id as string);

    return order;
  }

  async listOrders(
    limit = this.configService.get<number>('PAGE_LIMIT'),
    offset = 0,
    sort = SortEnum.desc,
    user: string = ''
  ) {
    const query: any = {};
    if (user) query.userId = user;

    const orders = await this.orderModel.find(query)
      .sort({ 'createdAt': sort })
      .limit(limit)
      .skip(offset * limit);    

    return { success: true, payload: orders.map(order => Order.toResponse(order)) } as ListOrdersResponse;
  }

  async getOrder(
    id: string
  ) {
    let order = await this.redisCacheService.get<Order>(`${RedisCacheKeys.GET_USER}:${id}`);

    order = order ? order : await this.orderModel.findOne({ _id: id });   
     
    if(!order){
      throw new NotFoundException('Order not found');
    }
    return { success: true, payload: Order.toResponse(order) } as OrderResponse;
  }

  async updateOrder(
    id: string, 
    updateOrderDto: UpdateOrderDto
  ) {
    const order = await this.getOrder(id);
    await this.orderModel.findOneAndUpdate({ _id: id }, updateOrderDto);
    
    return { success: true, payload: { ...order.payload, ...updateOrderDto }} as OrderResponse;
  }
}
