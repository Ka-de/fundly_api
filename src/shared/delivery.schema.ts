import { ApiProperty } from "@nestjs/swagger";
import { DeliveryEnum } from "./delivery.enum";

export class DeliverySchema {
    @ApiProperty({ description: 'The pick type for the delivery', required: true })
    pickup: DeliveryEnum;

    @ApiProperty({ description: 'The address to deliver it to', required: true })
    address: string;

    @ApiProperty({ description: 'The phone of the user picking it up', required: true })
    phone: string;

    @ApiProperty({ description: 'The cost of delivery', required: true })
    cost: number;
}