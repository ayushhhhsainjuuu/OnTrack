const express = require("express");
const router = express.Router();
const schedulingController = require("./schedulingController");
const schedulingService = require("./schedulingService");
const requireAuth = require("../middleware/requireAuth");
const requireSchedulePermission = require("../middleware/requireSchedulePermission");

router.use(requireAuth);

router.post(
  "/schedules",
  requireSchedulePermission((req) =>
    Promise.resolve({
      user_id: req.body.user_id,
      account_id: req.body.account_id,
      project_id: req.body.project_id,
    }),
  ),
  schedulingController.createSchedule,
);

router.patch(
  "/schedules/:id",
  requireSchedulePermission((req) =>
    schedulingService.getScheduleById(req.params.id),
  ),
  schedulingController.updateSchedule,
);

router.patch(
  "/schedules/:id/publish",
  requireSchedulePermission((req) =>
    schedulingService.getScheduleById(req.params.id),
  ),
  schedulingController.publishSchedule,
);

router.patch(
  "/schedules/:id/cancel",
  requireSchedulePermission((req) =>
    schedulingService.getScheduleById(req.params.id),
  ),
  schedulingController.cancelSchedule,
);

module.exports = router;
