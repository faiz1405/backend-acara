import { NextFunction, Request, Response } from "express";
import { getUserData, IUserToken } from "../utils/jwt";

export interface IRequest extends Request {
  user?: IUserToken;
}

export default (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(403).json({ message: "Unauthorized", data: null });
  }

  const [prefix, accessToken] = authorization.split(" ");

  if (!(prefix === "Bearer" && accessToken)) {
    return res.status(403).json({ message: "Unauthorized", data: null });
  }

  const user = getUserData(accessToken);

  if (!user) {
    return res.status(403).json({ message: "Unauthorized", data: null });
  }

  (req as IRequest).user = user;

  next();
};
