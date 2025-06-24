import { Router } from "express";
import * as WebChatController from "../controllers/WebChatController";

const webChatRoutes = Router();

webChatRoutes.post("/webchat/message", WebChatController.receiveMessage);

export default webChatRoutes;