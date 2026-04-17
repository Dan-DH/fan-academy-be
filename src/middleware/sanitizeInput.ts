import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Recursively sanitize all strings in an object.
 */
export function recursiveSanitizeInput(value: any): any {
  if (typeof value === 'string') {
    return xss(value);
  } else if (Array.isArray(value)) {
    return value.map(recursiveSanitizeInput);
  } else if (typeof value === 'object' && value !== null) {
    const sanitizedObj: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitizedObj[key] = recursiveSanitizeInput(value[key]);
      }
    }
    return sanitizedObj;
  } else {
    return value;
  }
}

// Use type assertions to override readonly behavior
export function sanitizeQueryInput(req: Request, res: Response, next: NextFunction): void {
  (req as any).body = recursiveSanitizeInput(req.body);
  (req as any).query = recursiveSanitizeInput(req.query);
  (req as any).params = recursiveSanitizeInput(req.params);
  next();
}
