import { Request, Response } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cookie from "cookie"
import * as UserService from "./user.service"
import * as UserDAO from "./user.dao"
import * as TokenService from "../token/token.service"
import * as TokenDAO from "../token/token.dao"
import authenticateToken from "../utils/authenticateToken"
import { TokenType } from "../token/token.interface"

export async function getUserData(request: Request, response: Response) {
  const tokenResult = authenticateToken(request)
  if (!tokenResult.isValid) {
    return response.status(tokenResult.statusCode).json({ message: tokenResult.message })
  }

  const user = await UserDAO.getUserById(tokenResult.userId)
  if (!user) {
    return response.status(404).json({ message: "User not found" })
  }

  return response.status(200).json(user)
}

export const registerSchema = z.object({
  body: z.object({
    nickname: z.string().min(1).max(20),
    email: z.string().email(),
    password: z.string().min(8),
  }),
})

export function logout(request: Request, response: Response) {
  response.clearCookie("accessToken")
  return response.status(200).json({ message: "Logged out" })
}

export async function register(request: Request, response: Response) {
  try {
    const { success, data, error } = registerSchema.safeParse(request)
    if (!success) {
      return response.status(400).json({ error })
    }
    const { email, nickname, password } = data.body

    const isEmailTaken = await UserDAO.checkIsEmailTaken(email)
    if (isEmailTaken) {
      return response.status(401).json({ message: "Email already exists" })
    }

    const isNicknameTaken = await UserDAO.checkIsNicknameTaken(email)
    if (isNicknameTaken) {
      return response.status(401).json({ message: "Nickname already exists" })
    }

    const userId = await UserService.createUser({ email, nickname, password })

    await TokenService.createAndSendAccountActivationToken({ userId, email })

    return response.status(200).json({ message: "User registered" })
  } catch (error) {
    console.error("error", JSON.stringify(error, null, 2))
    return response.status(400).json({ message: "Server error" })
  }
}

export const activateAccountSchema = z.object({
  params: z.object({
    token: z.string(),
  }),
})
export async function activateAccount(request: Request, response: Response) {
  try {
    const { success, data, error } = activateAccountSchema.safeParse(request)
    if (!success) {
      return response.status(400).json({ error })
    }

    const { token } = data.params

    const tokenResult = await TokenService.validateToken({ token, type: TokenType.activateAccount })
    if (!tokenResult.isValid) {
      return response.status(401).json({ message: tokenResult.errorMessage })
    }

    const { userId } = tokenResult
    await UserDAO.updateIsActive({ id: userId, isActive: true })
    await TokenDAO.deleteToken({ token })

    return response.status(200).json({ message: "Account activated" })
  } catch (error) {
    console.error("error", JSON.stringify(error, null, 2))
    return response.status(400).json({ message: "Server error" })
  }
}

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
})

export async function login(request: Request, response: Response) {
  try {
    const {
      body: { email, password },
    } = loginSchema.parse(request)

    const user = await UserDAO.getUserByEmail(email)
    if (!user) {
      return response.status(401).json({ message: "Invalid email or password" })
    }

    if (!user.isActive) {
      return response.status(401).json({ message: "User is not active" })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return response.status(401).json({ message: "Invalid email or password" })
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "1h" })

    response.setHeader(
      "Set-Cookie",
      cookie.serialize("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        maxAge: 3600, // 1 hour
        path: "/",
      }),
    )

    return response.status(200).json({ message: "Logged in" })
  } catch (error) {
    console.log("error", JSON.stringify(error))
    return response.status(400).json({ message: "Server error" })
  }
}

export async function forgotPassword(request: Request, response: Response) {
  try {
    const { email } = request.params
    if (!email) {
      return response.status(400).json({ message: "Email is required" })
    }

    const user = await UserDAO.getUserByEmail(email)
    if (!user) {
      return response.status(404).json({ message: "User not found" })
    }

    if (!user.isActive) {
      return response.status(401).json({ message: "User is not active" })
    }

    await TokenService.createAndSendPasswordResetToken({ userId: user.id, email })

    return response.status(200).json({ message: "Password reset email sent" })
  } catch (error) {
    console.log("error", JSON.stringify(error))
    return response.status(400).json({ message: "Server error" })
  }
}

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string(),
  }),
  body: z.object({
    password: z.string().min(8),
  }),
})
export async function resetPassword(request: Request, response: Response) {
  try {
    const { success, data, error } = resetPasswordSchema.safeParse(request)
    if (!success) {
      return response.status(400).json({ error })
    }
    const { token } = data.params
    const { password } = data.body

    const tokenResult = await TokenService.validateToken({ token, type: TokenType.resetPassword })
    if (!tokenResult.isValid) {
      return response.status(401).json({ message: tokenResult.errorMessage })
    }

    const { userId } = tokenResult
    await UserService.changeUserPassword({ id: userId, password })
    await TokenDAO.deleteToken({ token })

    return response.status(200).json({ message: "Password changed" })
  } catch (error) {
    console.log("error", JSON.stringify(error))
    return response.status(400).json({ message: "Server error" })
  }
}