const { getRecentAlerts } = require('../services/alert.service');

const getAlertsHistory = async (req, res) => {
    try {
        const alerts = await getRecentAlerts(50);
        res.json({ success: true, alerts });
    } catch (error) {
        console.error("Alert History Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch alerts" });
    }
};

module.exports = {
    getAlertsHistory
};
