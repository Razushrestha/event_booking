// const defaultPrintFormat = (qrData, ticketData) => {
//     // Extract data with fallbacks
//     const name = ticketData?.name || "Guest";
//     const eventName = ticketData?.eventName || "Event";
//     const email = ticketData?.email || "";
//     const number = ticketData?.number || "";

//     // Truncate long text to fit nicely (adjusted for larger fonts)
//     const truncatedEventName = eventName.length > 25 ? eventName.substring(0, 22) + "..." : eventName;
//     const truncatedName = name.length > 15 ? name.substring(0, 12) + "..." : name;
//     const truncatedEmail = email.length > 25 ? email.substring(0, 22) + "..." : email;
//     const truncatedNumber = number.length > 15 ? number.substring(0, 12) + "..." : number;

//     return `SIZE 100 mm, 50 mm
// GAP 3 mm, 0 mm
// DENSITY 8
// SPEED 4
// DIRECTION 1
// REFERENCE 0,0
// CLS
// REM === MAIN BORDER ===
// BOX 10,10,790,390,3
// REM === HEADER SECTION ===
// BOX 15,15,785,80,2
// TEXT 25,30,"2",0,2,2,"${truncatedEventName}"
// REM === QR CODE SECTION ===
// BOX 15,90,280,385,2
// QRCODE 25,100,H,6,M,0,M2,S4,"${qrData}"
// REM === ATTENDEE INFO SECTION ===
// BOX 290,90,785,385,2
// REM === ATTENDEE TITLE ===
// TEXT 300,105,"2",0,1,1,"${ticketData.ticketInfo.tierName || "General Admission"}"
// BAR 300,125,470,1
// REM === ATTENDEE DETAILS WITH LARGER FONTS ===
// TEXT 300,140,"2",0,2,2,"${name}"
// REM === BOTTOM SECTION ===
// BOX 300,250,470,290,1
// TEXT 310,260,"1",0,1,1,"EVENTSOLUTION"
// PRINT 1
// `;

//     // return `SIZE 100 mm, 50 mm
//     // GAP 3 mm, 0 mm
//     // DENSITY 8
//     // SPEED 4
//     // DIRECTION 1
//     // REFERENCE 0,0
//     // CLS
//     // REM === MAIN BORDER ===
//     // BOX 10,10,790,390,3
//     // REM === HEADER SECTION ===
//     // BOX 15,15,785,80,2
//     // TEXT 25,25,"2",0,2,2,"${truncatedEventName}"
//     // REM === QR CODE SECTION ===
//     // BOX 15,90,280,385,2
//     // QRCODE 25,100,H,6,M,0,M2,S4,"${qrData}"
//     // REM === ATTENDEE INFO SECTION ===
//     // BOX 290,90,785,385,2
//     // REM === ATTENDEE TITLE ===
//     // TEXT 300,105,"2",0,1,1,"${ticketData.ticketInfo.tierName || "General Admission"}"
//     // BAR 300,125,470,1
//     // REM === ATTENDEE DETAILS WITH LARGER FONTS ===
//     // TEXT 300,140,"2",0,1,1,"${name}"
//     // TEXT 300,170,"2",0,1,1,"${email}"
//     // TEXT 300,200,"2",0,1,1,"${number}"
//     // REM === BOTTOM SECTION ===
//     // BOX 300,250,470,290,1
//     // TEXT 310,260,"1",0,1,1,"EVENTSOLUTION"
//     // PRINT 1
//     // `;
// };

const defaultPrintFormat = (qrData, ticketData) => {
    // Extract data with fallbacks
    const name = ticketData?.name || "Guest";
    const eventName = ticketData?.eventName || "Event";
    const email = ticketData?.email || "";
    const number = ticketData?.number || "";

    // Truncate event name and other fields as before
    const truncatedEventName = eventName.length > 25 ? eventName.substring(0, 22) + "..." : eventName;
    const truncatedEmail = email.length > 25 ? email.substring(0, 22) + "..." : email;
    const truncatedNumber = number.length > 15 ? number.substring(0, 12) + "..." : number;

    // Handle long names by splitting into multiple lines
    const maxNameLength = 15; // Characters per line
    let nameLines = [];

    const tierNameRaw = ticketData.ticketInfo?.tierName || "General Admission";
    const tierName = tierNameRaw.charAt(0).toUpperCase() + tierNameRaw.slice(1);

    if (name.length <= maxNameLength) {
        nameLines.push(name);
    } else {
        // Split name into words
        const words = name.split(' ');
        let currentLine = '';

        for (const word of words) {
            // If adding this word would exceed the limit, start a new line
            if (currentLine.length + word.length + 1 > maxNameLength && currentLine.length > 0) {
                nameLines.push(currentLine.trim());
                currentLine = word;
            } else {
                currentLine += (currentLine.length > 0 ? ' ' : '') + word;
            }
        }

        // Add the last line if it has content
        if (currentLine.length > 0) {
            nameLines.push(currentLine.trim());
        }

        // Limit to maximum 2 lines to avoid layout issues
        if (nameLines.length > 2) {
            nameLines = nameLines.slice(0, 2);
            // Add ellipsis to the second line if it was truncated
            if (nameLines[1].length > maxNameLength - 3) {
                nameLines[1] = nameLines[1].substring(0, maxNameLength - 3) + "...";
            } else {
                nameLines[1] += "...";
            }
        }
    }

    // Generate TEXT commands for each line of the name
    let nameTextCommands = '';
    nameLines.forEach((line, index) => {
        const yPosition = 140 + (index * 35); // 35 units spacing between lines
        nameTextCommands += `TEXT 300,${yPosition},"2",0,2,2,"${line}"\n`;
    });

    // Adjust the bottom section position based on number of name lines
    // Calculate the Y position after the last name line with proper spacing
    const lastNameLineY = 140 + ((nameLines.length - 1) * 35);
    const bottomSectionY = Math.max(lastNameLineY + 60, 280); // At least 60 units gap after name
    const bottomTextY = bottomSectionY + 10;

    return `SIZE 100 mm, 50 mm
GAP 3 mm, 0 mm
DENSITY 8
SPEED 4
DIRECTION 1
REFERENCE 0,0
CLS
REM === MAIN BORDER ===
BOX 10,10,790,390,3
REM === HEADER SECTION ===
BOX 15,15,785,80,2
TEXT 25,30,"2",0,2,2,"${truncatedEventName}"
REM === QR CODE SECTION ===
BOX 15,90,280,385,2
QRCODE 25,100,H,6,M,0,M2,S4,"${qrData}"
REM === ATTENDEE INFO SECTION ===
BOX 290,90,785,385,2
REM === ATTENDEE TITLE ===
TEXT 300,105,"2",0,1,1,"${tierName}"
BAR 300,125,470,1
REM === ATTENDEE DETAILS WITH LARGER FONTS ===
${nameTextCommands}REM === BOTTOM SECTION ===
BOX 300,${bottomSectionY},470,${bottomSectionY + 40},1
TEXT 310,${bottomTextY},"1",0,1,1,"EVENTSOLUTION"
PRINT 1
`;
};

module.exports = {
    defaultPrintFormat
};
