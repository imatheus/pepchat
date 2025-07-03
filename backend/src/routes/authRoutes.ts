import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as UserController from "../controllers/UserController";
import isAuth from "../middleware/isAuth";
import envTokenAuth from "../middleware/envTokenAuth";
import { loginLimiter } from "../middleware/security";
import { validateLogin, validateUser } from "../middleware/validation";

const authRoutes = Router();

authRoutes.post("/signup", envTokenAuth, validateUser, UserController.store);
authRoutes.post("/login", loginLimiter, validateLogin, SessionController.store);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);

export default authRoutes;
