const schedulingService = require("./schedulingService");

async function createSchedule(req, res) {
  try {
    const schedule = await schedulingService.createSchedule(
      req.body,
      req.user.id,
    );
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function publishSchedule(req, res) {
  try {
    const schedule = await schedulingService.publishSchedule(req.params.id);
    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function cancelSchedule(req, res) {
  try {
    const { reason } = req.body;
    const schedule = await schedulingService.cancelSchedule(
      req.params.id,
      reason,
    );
    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateSchedule(req, res) {
  try {
    const schedule = await schedulingService.updateSchedule(
      req.params.id,
      req.body,
    );
    res.status(200).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createSchedule,
  publishSchedule,
  cancelSchedule,
  updateSchedule,
};
