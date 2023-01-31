import { CreateOrderDto } from "../../src/domains/orders/dto/create-order.dto"
import { Order } from "../../src/domains/orders/entities/order.entity"
import { DeliveryEnum } from "../../src/shared/delivery.enum";
import { OrderItemSchema } from "../../src/shared/order.item.schema"
import { OrderState } from "../../src/shared/order.state";
import { PlatformEnum } from "../../src/shared/platform.enum";

export const createOrderStub = (items: OrderItemSchema[]): CreateOrderDto => ({
    items,
    delivery: {
        pickup: DeliveryEnum.HOME,
        address: 'New house address',
        phone: '1234567890',
        cost: 1000
    },
    payment: {
        paymentId: '7jjkl-jk20990-90klkk-lkk',
        platform: PlatformEnum.CARD,
        platformName: 'Paystack',
        paid: true
    }
});

export const orderStub = (userId: string, items: OrderItemSchema[]): Partial<Order> => ({
    ...createOrderStub(items),
    userId,
    status: OrderState.ORDERED,
    totalCost: 5000,
});

