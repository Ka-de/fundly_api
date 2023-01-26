import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UsePipes, UseGuards, CacheKey, Query, Put, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CacheClear } from '../../decorators/cache-clear.decorator';
import { RedisCacheKeys } from '../../redis-cache/redis-cache.keys';
import { ApiHeader, ApiParam, ApiQuery, ApiResponse, PickType } from '@nestjs/swagger';
import { ItemResponse } from './responses/item.response';
import { ErrorResponse } from '../../errors/error.response';
import { CreateItemValidator } from './validators/create-item.validator';
import { JoiValidationPipe } from '../../pipes/joi-validation.pipe';
import { AuthorizeGuard } from '../../guards/authorize.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AccessRights } from '../../shared/access.right';
import { SortEnum } from '../../shared/sort.enum';
import { ListItemsResponse } from './responses/list-items.response';
import * as Joi from 'joi';
import { IdValidator } from '../../shared/id.validator';
import { ResponseSchema } from '../../shared/response.schema';
import { UpdateItemValidator } from './validators/update-item.validator';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { Storage } from '../../shared/storage';
import { FileValidator } from '../../shared/file.validator';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiResponse({ status: HttpStatus.CREATED, type: ItemResponse})
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
  @UsePipes(new JoiValidationPipe(CreateItemValidator))
  @CacheClear(RedisCacheKeys.LIST_ITEMS)
  @Post()
  createItem(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.createItem(createItemDto);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiQuery({ name: 'limit', required: false, description: 'The max number of items to fetch', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'The page number to fetch', type: Number })
  @ApiQuery({ name: 'sort', required: false, description: 'The order of sorting', enum: SortEnum, type: String })
  @ApiQuery({ name: 'query', required: false, description: 'The query for searching items', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: ListItemsResponse })
  @CacheKey(RedisCacheKeys.LIST_ITEMS)
  @Get()
  listItems(
    @Query('limit', new JoiValidationPipe(Joi.number().min(1))) limit?: number,
    @Query('offset', new JoiValidationPipe(Joi.number().min(0))) offset?: number,
    @Query('sort', new JoiValidationPipe(Joi.string().valid(...Object.values(SortEnum)))) sort?: SortEnum,
    @Query('query', new JoiValidationPipe(Joi.string().default(''))) query?: string
  ) {
    return this.itemsService.listItems(limit, offset, sort, query);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @CacheKey(RedisCacheKeys.GET_ITEM)
  @Get(':id')
  getItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ) {
    return this.itemsService.getItem(id);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ITEMS, RedisCacheKeys.GET_ITEM)
  @Patch(':id')
  updateItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @Body(new JoiValidationPipe(UpdateItemValidator)) updateItemDto: UpdateItemDto
  ) {
    return this.itemsService.updateItem(id, updateItemDto);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiResponse({ status: HttpStatus.OK, type: PickType(ResponseSchema, ['success']) })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @CacheClear(RedisCacheKeys.LIST_ITEMS)
  @Delete(':id')
  removeItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string
  ) {    
    return this.itemsService.removeItem(id);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @Put(':id/wishlist')
  wishlistItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') user: string,
  ) {
    return this.itemsService.wishlistItem(id, user);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(AuthorizeGuard)
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @Delete(':id/wishlist')
  unWishlistItem(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @CurrentUser('_id') user: string,
  ) {
    return this.itemsService.unWishlistItem(id, user);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @UseInterceptors(Storage.upload('images', 5))
  @Put(':id/images')
  uploadItemImages(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @UploadedFiles(new JoiValidationPipe(FileValidator.Many)) files: any,
  ) {
    return this.itemsService.uploadItemImages(id, files);
  }

  @ApiHeader({ name: 'token', required: true })
  @UseGuards(
    AuthorizeGuard, 
    new RolesGuard([AccessRights.SUPERADMIN, AccessRights.ADMIN])
  )
  @ApiParam({ name: 'id', required: true, description: 'The id of the item' })
  @ApiResponse({ status: HttpStatus.OK, type: ItemResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponse })
  @Delete(':id/images')
  removeItemImages(
    @Param('id', new JoiValidationPipe(IdValidator())) id: string,
    @Body('files', new JoiValidationPipe(Joi.array().min(1))) files: any,
  ) {
    return this.itemsService.removeItemImages(id, files);
  }
}
