import { ApiProperty } from "@nestjs/swagger";
import { PlatformEnum } from "./platform.enum";

export class OrderItemSchema {
    @ApiProperty({ description: 'The id of the item', required: true })
    _id: string;

    @ApiProperty({ description: 'The quantity of the item', required: true  })
    quantity: number;

    @ApiProperty({ description: 'The price of the item', required: true })
    price: number;
}
