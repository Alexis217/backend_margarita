import { Router } from "express";

import {
  getCausaStatus,
  getMonthlyRevenue,
} from "../controllers/dashboard.controllers.js";

const routerDashboard = Router();

routerDashboard.get("/get-causa-status", getCausaStatus);
routerDashboard.get("/get-monthly-revenue", getMonthlyRevenue);

export { routerDashboard };
