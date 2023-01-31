import * as Joi from 'joi';
import { DeliveryEnum } from '../../../shared/delivery.enum';
import { PlatformEnum } from '../../../shared/platform.enum';

const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}$/m;

export const CreateOrderValidator = Joi.object({
  items: Joi.array().items({
    _id: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().required()
  }).required(),

  delivery: Joi.object({
    pickup: Joi.string().valid(...Object.values(DeliveryEnum)).required(),
    address: Joi.string().required(),
    phone: Joi.string().required().regex(phoneRegex).error((e) => {    
      return new Error('"delivery.phone" must be a valid phone number')
    }),
    cost: Joi.number().required()
  }).required(),

  payment: Joi.object({
    paymentId: Joi.string(),
    platform: Joi.string().valid(...Object.values(PlatformEnum)).required(),
    platformName: Joi.string(),
    paid: Joi.boolean().default(false)
  })
});
