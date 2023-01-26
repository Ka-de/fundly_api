import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true, versionKey: false })
export class Item {
    @ApiProperty({ description: 'The _id of the item' })
    @Prop({ type: String, default: uuidv4 })
    _id?: string;

    @ApiProperty({ description: 'The title of the item', required: true })
    @Prop({ unique: true, required: [true, "Title is required"] })
    title: string;

    @ApiProperty({ description: 'The price of the item', required: true })
    @Prop({ required: [true, "Price is required"] })
    price: number;

    @ApiProperty({ description: 'The quantity of the item in store', default: 0 })
    @Prop({ default: 0 })
    quantity: number;

    @ApiProperty({ description: 'The tags of the item', default: [] })
    @Prop({ default: [], type: [String] })
    tags: string[];

    @ApiProperty({ description: 'The users that added this item to their wishlist' })
    @Prop({ default: [] })
    wishlistedBy: string[];

    @ApiProperty({ description: 'The images of the item' })
    @Prop({ default: [] })
    images: string[];

    @ApiProperty({ description: 'The decription of the item' })
    @Prop({ default: '' })
    description?: string;

    static toResponse(data: any){
        const item = data._doc;
        delete item.hidden;
        
        return item;
    }
}

export type ItemDocument = Item | Document;
export const ItemSchema = SchemaFactory.createForClass(Item);
