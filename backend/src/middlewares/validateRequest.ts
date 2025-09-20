import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    (error as any).status = 400;
    (error as any).errors = errors.array();
    return next(error);
  }
  next();
}