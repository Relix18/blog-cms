import express from "express";
import { IUser } from "./src/types/types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
    }
  }
}
