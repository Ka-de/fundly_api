import { ApiProperty } from "@nestjs/swagger";

export class CreateItemDto {
    @ApiProperty({ description: 'The title of the item', required: true })
    title: string;

    @ApiProperty({ description: 'The price of the item', required: true })
    price: number;

    @ApiProperty({ description: 'The quantity of the item in store', default: 0 })
    quantity: number;

    @ApiProperty({ description: 'The tags of the item', default: [] })
    tags?: string[];

    @ApiProperty({ description: 'The decription of the item' })
    description?: string;
}
