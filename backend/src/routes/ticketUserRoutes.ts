import express from "express";
import isAuth from "../middleware/isAuth";
import { linkUser, unlinkUser } from "../controllers/TicketUserController";

const ticketUserRoutes = express.Router();

ticketUserRoutes.post("/tickets/:ticketId/link", isAuth, linkUser);

ticketUserRoutes.delete("/tickets/:ticketId/link/:userId", isAuth, unlinkUser);

export default ticketUserRoutes;
