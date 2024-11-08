import { Router } from "express";

import {
  getInfoQuoteCtrl,
  PendingGoalsCtrl,
  renderGoalsCtrl,
  acceptGoalCtrl,
  rejectGoalCtrl,
  getCauseinfo,
} from "../controllers/goals.controllers.js";

import { authenticateJWTCtrl } from "../middlewares/authenticateJWT.js";

const routerGoals = Router();

routerGoals.get("/quotes-info", getInfoQuoteCtrl);
routerGoals.post(
  "/upload-pending-goals",
  authenticateJWTCtrl,
  PendingGoalsCtrl
);
routerGoals.get("/get-info-goals", renderGoalsCtrl);
routerGoals.post("/accept-goal/:id", acceptGoalCtrl);
routerGoals.post("/reject-goal/:id", rejectGoalCtrl);
routerGoals.get("/get-cause/:id", getCauseinfo);

export { routerGoals };
