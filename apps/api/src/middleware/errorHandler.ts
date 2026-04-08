import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  if (err instanceof Error) {
    console.error(err.message)
    res.status(500).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Internal server error' })
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export function notFoundHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message })
    return
  }
  next(err)
}
