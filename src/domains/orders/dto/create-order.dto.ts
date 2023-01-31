import { ApiProperty, PickType } from "@nestjs/swagger";
import { DeliverySchema } from "../../../shared/delivery.schema";
import { OrderItemSchema } from "../../../shared/order.item.schema";
import { PaymentSchema } from "../../../shared/payment.schema";

export class CreateOrderDto {
    @ApiProperty({ description: 'The list of items ordered', required: true, type: [OrderItemSchema] })
    items: OrderItemSchema[];

    @ApiProperty({ description: 'The delivery details', required: true, type: DeliverySchema })
    delivery: DeliverySchema;

    @ApiProperty({ description: 'The payment details', type: PaymentSchema })
    payment?: PaymentSchema;
}
