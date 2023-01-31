import { CreateItemDto } from "../../src/domains/items/dto/create-item.dto"
import { Item } from "../../src/domains/items/entities/item.entity"

export const createItemStub: CreateItemDto = {
    title: 'New Item',
    price: 1000,
    quantity: 100,
    tags: ['New', 'item']
}

export const itemStub: Partial<Item> = {
    ...createItemStub,
    wishlistedBy: [],
    images: []
}
