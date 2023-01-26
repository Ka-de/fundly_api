import * as Joi from 'joi';
import { AccessRights } from '../../../shared/access.right';

export const UpdateItemValidator = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number().positive(),
  quantity: Joi.number().integer(),
  tags: Joi.array(),
});
