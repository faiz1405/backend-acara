import { Request, Response } from "express";
import * as Yup from "yup";

import UserModel from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { IRequest } from "../middleware/auth.middleware";

type TRegiter = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type TLogin = {
  identifier: string;
  password: string;
};

const registerValidateSchema = Yup.object({
  fullName: Yup.string().required(),
  email: Yup.string().email().required(),
  username: Yup.string().required(),
  password: Yup.string().required(),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref("password"), ""], "Password does not match"),
});

export default {
  async register(req: Request, res: Response) {
    const { fullName, email, username, password, confirmPassword } =
      req.body as unknown as TRegiter;

    try {
      await registerValidateSchema.validate({
        fullName,
        email,
        username,
        password,
        confirmPassword,
      });

      const result = await UserModel.create({
        fullName,
        email,
        username,
        password,
      });

      res.status(200).json({
        message: "Success Register",
        data: { result },
      });
    } catch (error) {
      const err = error as unknown as Error;

      res.status(400).json({
        message: err.message,
        data: null,
      });
    }
  },

  async login(req: Request, res: Response) {
    const { identifier, password } = req.body as unknown as TLogin;
    try {
      //get data user base on identifier -> email or username
      const userByIdentifier = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!userByIdentifier) {
        return res.status(403).json({
          message: "User not found",
          data: null,
        });
      }

      // validate password
      const validatePassword: boolean =
        encrypt(password) === userByIdentifier.password;

      if (!validatePassword) {
        return res.status(403).json({
          message: "Password not match",
          data: null,
        });
      }

      const token = generateToken({
        id: userByIdentifier._id,
        role: userByIdentifier.role,
      });

      res.status(200).json({
        message: "login Success",
        data: token,
      });
    } catch (error) {
      const err = error as unknown as Error;

      res.status(400).json({
        message: err.message,
        data: null,
      });
    }
  },

  async me(req: IRequest, res: Response) {
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      res.status(200).json({
        message: "Success Get User",
        data: result,
      });
    } catch (error) {
      const err = error as unknown as Error;

      res.status(400).json({
        message: err.message,
        data: null,
      });
    }
  },
};
