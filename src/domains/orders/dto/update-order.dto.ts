import { Prop } from '@nestjs/mongoose';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaymentSchema } from '../../../shared/payment.schema';
import { OrderState } from '../../../shared/order.state';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @ApiProperty({ description: 'The state of the order' })
    @Prop({ type: String, default: OrderState.ORDERED })
    status: OrderState;

    @ApiProperty({ description: 'The payment details', type: PaymentSchema })
    payment: PaymentSchema;
}
