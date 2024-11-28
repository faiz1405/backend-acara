import { Request, Response } from "express";

type TRegiter = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export default {
  register(req: Request, res: Response) {
    const { fullName, email, username, password, confirmPassword } =
      req.body as TRegiter;
  },
};
