import express from "express";
import isAuth from "../middleware/isAuth";
import isAuthWithExpiredAccess from "../middleware/isAuthWithExpiredAccess";
import * as QueueOptionController from "../controllers/QueueOptionController";
import * as InvoicesController from "../controllers/InvoicesController"

const invoiceRoutes = express.Router();

invoiceRoutes.get("/invoices", isAuthWithExpiredAccess, InvoicesController.index);
invoiceRoutes.get("/invoices/list", isAuthWithExpiredAccess, InvoicesController.list);
invoiceRoutes.get("/invoices/all", isAuthWithExpiredAccess, InvoicesController.list);
invoiceRoutes.get("/invoices/:Invoiceid", isAuthWithExpiredAccess, InvoicesController.show);
invoiceRoutes.put("/invoices/:id", isAuthWithExpiredAccess, InvoicesController.update);

export default invoiceRoutes;
