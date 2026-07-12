// const adminPrintFormat = (printData, printNumber) => {
//     const { mainHeader = "Event Solution", line1 = "", line2 = "", line3 = "", totalPrints = 1 } = printData;
//     const currentDateTime = new Date().toLocaleString("en-US", {
//         timeZone: "Asia/Kathmandu",
//         hour12: true,
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit"
//     }); // e.g., "Aug 6, 2025, 04:52 PM +0545"

//     // Truncate fields to prevent overflow
//     const maxLength = 25;
//     const truncate = (str) => str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
//     const truncatedMainHeader = truncate(mainHeader);
//     const truncatedLine1 = truncate(line1);
//     const truncatedLine2 = truncate(line2);
//     const truncatedLine3 = truncate(line3);

//     // Calculate positions for center alignment
//     const pageWidth = 800; // 100mm at 8 dots/mm
//     const pageHeight = 400; // 50mm at 8 dots/mm
//     const textWidth = 700; // Approximate width for text block
//     const startX = (pageWidth - textWidth) / 2; // Center horizontally
//     const lineHeight = 40; // Spacing between lines
//     const totalLines = [truncatedMainHeader, truncatedLine1, truncatedLine2, truncatedLine3].filter(line => line).length;
//     const totalHeight = totalLines * lineHeight + 80; // Increased for header/footer
//     const startY = (pageHeight - totalHeight) / 2; // Center vertically

//     let commands = `SIZE 100 mm, 50 mm
// GAP 3 mm, 0 mm
// DENSITY 8
// SPEED 4
// DIRECTION 1
// REFERENCE 0,0
// CLS
// REM === OUTER BORDER ===
// BOX 5,5,795,395,5
// REM === HEADER SECTION ===
// BOX 15,15,785,90,3
// REM === LOGO PLACEHOLDER (Centered, 50x50 pixels) ===
// BITMAP 375,25,0,50,50,"logo.bmp" REM Replace "logo.bmp" with actual logo file
// REM === MAIN CONTENT SECTION ===
// BOX 15,100,785,300,3
// `;

//     // Add text lines with professional styling
//     let currentY = startY + 20; // Offset for header
//     if (truncatedMainHeader) {
//         commands += `TEXT ${startX},${currentY},"3",0,3,3,"${truncatedMainHeader}"\n`; // Larger, bolder font for header
//         currentY += lineHeight + 10; // Increased spacing for emphasis
//     }
//     if (truncatedLine1) {
//         commands += `TEXT ${startX},${currentY},"2",0,2,2,"${truncatedLine1}"\n`;
//         currentY += lineHeight;
//     }
//     if (truncatedLine2) {
//         commands += `TEXT ${startX},${currentY},"2",0,2,2,"${truncatedLine2}"\n`;
//         currentY += lineHeight;
//     }
//     if (truncatedLine3) {
//         commands += `TEXT ${startX},${currentY},"2",0,2,2,"${truncatedLine3}"\n`;
//         currentY += lineHeight;
//     }

//     // Add footer with timestamp and print counter
//     const footerY = 320; // Fixed position near bottom
//     commands += `BOX 15,${footerY},785,${footerY + 60},3\n`;
//     commands += `TEXT ${startX},${footerY + 10},"1",0,1,1,"Printed: ${currentDateTime}"\n`;
//     commands += `TEXT ${startX},${footerY + 30},"1",0,1,1,"Print ${printNumber} of ${totalPrints}"\n`;

//     commands += `PRINT ${totalPrints}\n`;
//     return commands;
// };



const adminPrintFormat = (printData, printNumber) => {
    const { mainHeader = "Event Solution", line1 = "", line2 = "", line3 = "", totalPrints = 1 } = printData;

    const currentDateTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu",
        hour12: true,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    // === Utility: word wrap based on max length ===
    const wrapText = (text, maxLen) => {
        const words = text.split(" ");
        const lines = [];
        let current = "";

        words.forEach(word => {
            if ((current + word).length <= maxLen) {
                current += (current ? " " : "") + word;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        });
        if (current) lines.push(current);
        return lines;
    };

    // Wrap header into multiple lines (instead of truncating)
    const headerLines = wrapText(mainHeader, 13); // adjust maxLen based on font size
    const bodyLines = [line1, line2, line3].filter(l => l);

    // Page setup
    const pageWidth = 800;
    const pageHeight = 400;
    const lineHeight = 40;

    let commands = `SIZE 100 mm, 50 mm
GAP 3 mm, 0 mm
DENSITY 8
SPEED 4
DIRECTION 1
REFERENCE 0,0
CLS
REM === OUTER BORDER ===
BOX 5,5,795,395,5
`;

    // === HEADER (supports wrapping) ===
    let currentY = 30;
    headerLines.forEach(line => {
        commands += `TEXT 40,${currentY},"3",0,3,3,"${line}"\n`;
        currentY += lineHeight + 15; // slightly bigger spacing for headers
    });

    // === BODY CONTENT ===
    currentY += 20; // space after header
    bodyLines.forEach(line => {
        commands += `TEXT 40,${currentY},"2",0,2,2,"${line}"\n`;
        currentY += lineHeight;
    });

    // === FOOTER ===
    const footerY = 320;
    commands += `BOX 15,${footerY},785,${footerY + 60},3\n`;
    commands += `TEXT 40,${footerY + 10},"1",0,1,1,"Printed: ${currentDateTime}"\n`;

    if (totalPrints > 1) {
        commands += `TEXT 40,${footerY + 30},"1",0,1,1,"Print ${printNumber + 1} of ${totalPrints}"\n`;
    }

    commands += `PRINT 1\n`; // always 1 at a time
    return commands;
};


module.exports = { adminPrintFormat };
