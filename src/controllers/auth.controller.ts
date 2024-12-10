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
  password: Yup.string()
    .required()
    .min(6, "password must be at last 6 character")
    .test(
      "at-least-one-uppercase-letter",
      "Contains at least one uppercase character",
      (value) => {
        if (!value) return false;
        const regex = /^(?=.*[A-Z])/;
        return regex.test(value);
      }
    )
    .test("at-least-one-number", "Contains at least one number", (value) => {
      if (!value) return false;
      const regex = /^(?=.*\d)/;
      return regex.test(value);
    }),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref("password"), ""], "Password does not match"),
});

export default {
  async register(req: Request, res: Response) {
    /**
     #swagger.tags = ["Auth"]
     */
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
    /**
      #swagger.tags = ["Auth"]  #swagger.tags = ["Auth"]
     
     #swagger.requestBody = {
       required: true,
       schema:{$ref: '#/components/schemas/LoginRequest'}
     }
     */
    const { identifier, password } = req.body as unknown as TLogin;
    try {
      //get data user base on identifier -> email or username
      const userByIdentifier = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
        isActive: true,
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
    /**
      #swagger.tags = ["Auth"]  #swagger.tags = ["Auth"]
     
     #swagger.security = [
       {
         "bearerAuth": []
       }
     ]
     */
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

  async activation(req: Request, res: Response) {
    /**
     #swagger.tags = ["Auth"]
     #swagger.requestBody = {
     required:true,
     schema: {$ref: '#/components/schemas/ActivationRequest'}
  }
     */
    try {
      const { code } = req.body as { code: string };

      const user = await UserModel.findOneAndUpdate(
        { activactionCode: code },
        { isActive: true },
        { new: true }
      );
      res.status(200).json({
        message: "User successfully activated",
        data: user,
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
