const { thermalPrintWithWarning } = require('../print/print.websocket');
const GenRes = require('../../utils/router/GenRes');
const { adminPrintFormat } = require('./admin.format');

const printByAdmin = async (req, res) => {
    try {
        const { mainHeader, line1, line2, line3, totalPrints } = req.body;

        if (!mainHeader || !totalPrints || isNaN(totalPrints) || totalPrints <= 0) {
            return res.status(400).json(GenRes(400, null, null, "Main header and valid total prints are required", req.url));
        }

        const printJob = {
            mainHeader,
            line1: line1 || "",
            line2: line2 || "",
            line3: line3 || "",
            totalPrints: parseInt(totalPrints),
            currentPrints: 0,
        };

        const savedJob = adminPrintFormat(printJob, printJob.currentPrints);
        return await thermalPrintWithWarning(savedJob, req, res);
    } catch (error) {
        console.error("[createThermalPrintJob] Error creating print job", error);
        return res.status(500).json(GenRes(500, null, null, "Internal server error", req.url));
    }
};

module.exports = {
    printByAdmin
};
