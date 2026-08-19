// makes req.user visible to TypeScript everywhere, populated by the authenticate middleware
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
