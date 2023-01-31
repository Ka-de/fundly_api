import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { DeliverySchema } from "../../../shared/delivery.schema";
import { OrderItemSchema } from "../../../shared/order.item.schema";
import { OrderState } from "../../../shared/order.state";
import { PaymentSchema } from "../../../shared/payment.schema";
import { v4 as uuidv4 } from 'uuid';
import { PlatformEnum } from "../../../shared/platform.enum";

@Schema({ timestamps: true, versionKey: false })
export class Order {
    @ApiProperty({ description: 'The order id' })
    @Prop({ type: String, default: uuidv4 })
    readonly _id?: string;

    @ApiProperty({ description: 'The user id' })
    @Prop({ required: [true, 'Id of user is required'] })
    readonly userId: string;

    @ApiProperty({ description: 'The list of items ordered' })
    @Prop({ type: [{ _id: String, quantity: Number, price: Number}], required: [true, 'Items ordered is required'] })
    items: OrderItemSchema[];

    @ApiProperty({ description: 'The total cost of items' })
    @Prop({ type: Number, required: [true, 'Total cost is required'] })
    totalCost: number;

    @ApiProperty({ description: 'The delivery details' })
    @Prop({ type: { pickup: String, address: String, phone: String, cost: Number }, required: [true, 'Delivery details is required'], _id: false })
    delivery: DeliverySchema;

    @ApiProperty({ description: 'The payment details' })
    @Prop({ type: { paymentId: String, platform: String, platformName: String, paid: Boolean }, default: { platform: PlatformEnum.CASH, paid: false }, _id: false })
    payment: PaymentSchema;

    @ApiProperty({ description: 'The state of the order' })
    @Prop({ type: String, default: OrderState.ORDERED })
    status: OrderState;

    @ApiProperty({ description: 'The user creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'The user update date' })
    updatedAt: Date;

    static toResponse(data: any) {
        const user = data._doc;
        return user;
    }
}

export type OrderDocument = Order | Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
