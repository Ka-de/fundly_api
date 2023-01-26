import { CreateItemDto } from "../../src/domains/items/dto/create-item.dto"
import { Item } from "../../src/domains/items/entities/item.entity"

export const createitemStub: CreateItemDto = {
    title: 'New Item',
    price: 5000,
    quantity: 100,
    tags: ['New', 'item']
}

export const itemStub: Partial<Item> = {
    ...createitemStub,
    wishlistedBy: [],
    images: []
}
