const GenRes = require("../../utils/router/GenRes");
const WebSocket = require("ws");
const PrintingState = require("./printState.model");
const crypto = require('crypto'); // Built-in Node.js crypto

// ---- BAND-AID FIX: Mini in-memory cache for deduplication ----
const printCache = new Map(); // { hash -> timestamp }

// Auto-cleanup old entries every 10 seconds
setInterval(() => {
    const now = Date.now();
    for (const [hash, ts] of printCache.entries()) {
        if (now - ts > 5000) printCache.delete(hash); // Keep for 5 seconds
    }
}, 10000);

async function getPrintingState() {
    let state = await PrintingState.findOne();
    if (!state) {
        state = new PrintingState({ enabled: false });
        await state.save();
    }
    return state;
}

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    const clients = new Set();

    wss.on("connection", async (ws) => {
        try {
            const state = await getPrintingState();
            if (!state.enabled) {
                console.log("🔴 WebSocket connection rejected: Printing is disabled");
                ws.close(1008, "Printing is disabled");
                return;
            }
            console.log("🟢 Print agent connected via WebSocket");
            clients.add(ws);

            ws.on("close", () => {
                clients.delete(ws);
                console.log("🔴 Print agent disconnected");
            });
        } catch (error) {
            console.error("❌ Error handling WebSocket connection:", error.message);
            ws.close(1011, "Server error");
        }
    });

    // Return an object with clients for use in exported functions
    return { wss, clients };
}

async function togglePrinting(req, res) {
    try {
        const state = await getPrintingState();
        state.enabled = !state.enabled;
        await state.save();

        const { clients } = req.app.locals.websocket; // Access clients from app.locals

        if (!state.enabled) {
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.close(1008, "Printing disabled");
                }
            });
            clients.clear();
            console.log("🔴 WebSocket printing disabled");
        } else {
            console.log("🟢 WebSocket printing enabled");
        }

        return res.status(200).json(
            GenRes(200, { enabled: state.enabled }, null, "WebSocket state toggled successfully", req.url)
        );
    } catch (error) {
        console.error("❌ Error toggling WebSocket state:", error.message);
        return res.status(500).json(
            GenRes(500, null, error, "Failed to toggle WebSocket state", req.url)
        );
    }
}

async function printTspl(req, res) {
    try {
        const { tspl } = req.body;
        if (!tspl || typeof tspl !== "string") {
            console.error("❌ Invalid or missing tspl in print request");
            return res.status(400).json(
                GenRes(400, null, new Error("Invalid tspl"), "tspl is required and must be a string", req.url)
            );
        }
        thermalPrint(tspl, req, res);
        return res.status(200).json(
            GenRes(200, { status: "queued" }, null, "TSPL print request queued", req.url)
        );
    } catch (error) {
        console.error("❌ Error processing TSPL print request:", error.message);
        return res.status(500).json(
            GenRes(500, null, error, "Failed to process TSPL print request", req.url)
        );
    }
}

async function triggerPrint(req, res) {
    try {
        const state = await getPrintingState();
        if (!state.enabled) {
            console.error("❌ Print request rejected: WebSocket printing is disabled");
            return res.status(403).json(
                GenRes(403, null, new Error("Printing is disabled"), "Printing is disabled", req.url)
            );
        }

        const { qrData } = req.body;
        if (!qrData || typeof qrData !== "string") {
            console.error("❌ Invalid or missing qrData in print request");
            return res.status(400).json(
                GenRes(400, null, new Error("Invalid qrData"), "qrData is required and must be a string", req.url)
            );
        }

        console.log("📨 Print request received:", qrData);
        const tspl = `
SIZE 100 mm, 50 mm
GAP 3 mm, 0 mm
DENSITY 8
SPEED 4
DIRECTION 1
REFERENCE 0,0
CLS
BOX 10,10,790,390,2
QRCODE 250,80,H,8,A,0,"${qrData}"
PRINT 1
`;

        // ---- USE DEDUPLICATED THERMAL PRINT ----
        return thermalPrint(tspl, req, res);

    } catch (error) {
        console.error("❌ Error processing print request:", error.message);
        return res.status(500).json(
            GenRes(500, null, error, "Failed to process print request", req.url)
        );
    }
}

async function thermalPrint(tspl, req) {
    try {
        const state = await getPrintingState();
        if (!state.enabled) {
            return { success: false, reason: "printing_disabled" };
        }

        if (!tspl || typeof tspl !== "string") {
            return { success: false, reason: "invalid_tspl" };
        }

        // --- Deduplication ---
        const hash = crypto.createHash("md5").update(tspl.trim()).digest("hex");
        const now = Date.now();
        const recent = printCache.get(hash);

        if (recent && now - recent < 3000) {
            console.log(`Duplicate print blocked [${hash}]`);
            return { success: false, reason: "duplicate", suppressed: true };
        }
        printCache.set(hash, now);

        // --- Send to WebSocket clients ---
        const { clients } = req.app.locals.websocket;
        let sent = false;
        const printId = `${now}-${Math.random().toString(36).substr(2, 5)}`;

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "print", tspl, printId }));
                sent = true;
            }
        });

        if (sent) {
            console.log(`Print command sent [${printId}]`);
            return { success: true, printId };
        } else {
            console.warn("No WebSocket clients connected");
            return { success: false, reason: "no_clients" };
        }
    } catch (error) {
        console.error("Error in thermalPrint:", error.message);
        return { success: false, reason: "exception", error: error.message };
    }
}

async function thermalPrintWithWarning(tspl, req, res) {
    try {
        const state = await getPrintingState();
        if (!state.enabled) {
            console.error("❌ Thermal print request rejected: WebSocket printing is disabled");
            return res.status(403).json(
                GenRes(403, null, new Error("Printing is disabled"), "Printing is disabled", req.url)
            );
        }

        if (!tspl || typeof tspl !== "string") {
            console.error("❌ Invalid or missing tspl in thermal print request");
            throw new Error("Invalid tspl data");
        }

        // ---- SAME DEDUPLICATION LOGIC ----
        const hash = crypto.createHash('md5').update(tspl.trim()).digest('hex');
        const now = Date.now();
        const recent = printCache.get(hash);

        if (recent && now - recent < 3000) {
            console.log(`🛑 Duplicate print blocked (with warning): ${hash.slice(0, 8)}...`);
            throw new Error("Print suppressed: recent duplicate detected");
        }

        printCache.set(hash, now);

        const { clients } = req.app.locals.websocket;
        let sent = false;
        let sentCount = 0;

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                const printId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                client.send(JSON.stringify({ type: "print", tspl, printId }));
                sent = true;
                sentCount++;
            }
        });

        if (sent) {
            console.log(`✅ Thermal print with warning sent to ${sentCount} client(s)`);
            return res.status(200).json(
                GenRes(200, { sent: true, clients: sentCount }, null, "Print command sent", req.url)
            );
        } else {
            console.warn("⚠️ No connected WebSocket clients to receive print command");
            throw new Error("No connected clients to receive print command");
        }

    } catch (error) {
        console.error("❌ Error processing thermal print with warning:", error.message);
        if (res) {
            return res.status(500).json(
                GenRes(500, null, error, "Failed to process thermal print", req.url)
            );
        }
        throw error; // Re-throw if no response object
    }
}

module.exports = { setupWebSocket, togglePrinting, triggerPrint, thermalPrint, printTspl, thermalPrintWithWarning };