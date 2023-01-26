import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResponseSchema } from "../../../shared/response.schema";
import { Item } from "../entities/item.entity";

export class ListItemsResponse extends PickType(ResponseSchema<Item[]>, ['payload', 'timestamp', 'success']){
  @ApiProperty({ description: 'The payload of the response', type: [Item] })
  payload?: Item[];
}