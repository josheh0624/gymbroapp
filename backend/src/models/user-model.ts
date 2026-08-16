export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string; // present in DB, but strip before sending to client
  created_at: Date;
  age?: number;
  height_ft?: number;
  weight_lbs?: number;
  sex?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export { };

export type SafeUser = Omit<UserRow, "password_hash">;
