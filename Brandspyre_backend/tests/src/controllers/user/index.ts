import { Request, Response } from "express";
import { getAllUsers } from "../../db/users";

export const fetchUsers = async (_req: Request, res: Response) => {
  const users = await getAllUsers();
  res.json(users);
};
