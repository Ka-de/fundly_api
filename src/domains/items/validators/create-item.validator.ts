import * as Joi from 'joi';
import { AccessRights } from '../../../shared/access.right';

const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}$/m;

export const CreateItemValidator = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer(),
  tags: Joi.array(),
});
