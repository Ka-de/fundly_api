import * as Joi from 'joi';
import { PlatformEnum } from '../../../shared/platform.enum';
import { OrderState } from '../../../shared/order.state';

export const UpdateOrderValidator = Joi.object({
  status: Joi.string().valid(...Object.values(OrderState)),
  payment: Joi.object({
    paymentId: Joi.string(),
    platform: Joi.string().valid(...Object.values(PlatformEnum)).required(),
    platformName: Joi.string(),
    paid: Joi.boolean().default(false)
  })
});
