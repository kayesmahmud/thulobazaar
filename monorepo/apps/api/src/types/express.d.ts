declare global {
  namespace Express {
    interface User {
      userId: number;
      email: string;
      role?: string;
    }

    interface Request {
      user?: User;
      admin?: {
        id: number;
        email: string;
        role: string;
      };
      editor?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export {};
