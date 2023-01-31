import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResponseSchema } from "../../../shared/response.schema";
import { Order } from "../entities/order.entity";

export class OrderResponse extends PickType(ResponseSchema<Order>, ['payload', 'timestamp', 'success']){
  @ApiProperty({ description: 'The payload of the response', type: Order })
  payload?: Order;
}