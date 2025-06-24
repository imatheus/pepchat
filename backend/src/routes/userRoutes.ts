import { Router } from "express";

import isAuth from "../middleware/isAuth";
import isAuthWithExpiredAccess from "../middleware/isAuthWithExpiredAccess";
import * as UserController from "../controllers/UserController";

const userRoutes = Router();

userRoutes.get("/users", isAuthWithExpiredAccess, UserController.index);

userRoutes.get("/users/list", isAuthWithExpiredAccess, UserController.list);

userRoutes.post("/users", isAuthWithExpiredAccess, UserController.store);

userRoutes.put("/users/:userId", isAuthWithExpiredAccess, UserController.update);

userRoutes.get("/users/:userId", isAuthWithExpiredAccess, UserController.show);

userRoutes.delete("/users/:userId", isAuthWithExpiredAccess, UserController.remove);

export default userRoutes;
