import PDFDocument from "pdfkit";

const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN");
};

const formatAmount = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2)}`;
};

/**
 * Draw one Bilty on the current PDF page
 */
export const drawBilty = (doc, booking) => {
    // ==========================================
    // HEADER
    // ==========================================

    doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("MAHAKAL TRANSPORT", {
            align: "center",
        });

    doc
        .moveDown(0.3)
        .fontSize(10)
        .font("Helvetica")
        .text("Transport & Parcel Service", {
            align: "center",
        });

    doc
        .moveDown(0.3)
        .fontSize(9)
        .text(
            "Contact: +91 XXXXXXXXXX | Email: info@mahakaltransport.com",
            {
                align: "center",
            }
        );

    doc.moveDown(1);

    // ==========================================
    // TITLE
    // ==========================================

    doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("BOOKING / BILTY", {
            align: "center",
        });

    doc.moveDown(0.8);

    // ==========================================
    // BOOKING INFORMATION
    // ==========================================

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Bilty No: ${booking.bookingNumber || "-"}`);

    doc
        .font("Helvetica")
        .text(`Date: ${formatDate(booking.bookingDate)}`);

    doc.moveDown(1);

    // ==========================================
    // SENDER & RECEIVER
    // ==========================================

    const startY = doc.y;

    // Sender
    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("SENDER");

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Name: ${booking.sender?.name || "-"}`);

    doc.text(`Mobile: ${booking.sender?.mobile || "-"}`);

    doc.text(`Address: ${booking.sender?.address || "-"}`);

    // Receiver
    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("RECEIVER", 320, startY);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            `Shop: ${booking.customer?.shopName || "-"}`,
            320
        );

    doc.text(
        `Owner: ${booking.customer?.ownerName || "-"}`,
        320
    );

    doc.text(
        `Mobile: ${booking.customer?.mobile || "-"}`,
        320
    );

    doc.text(
        `Address: ${booking.deliveryAddress || "-"}`,
        320
    );

    doc.moveDown(2);

    // ==========================================
    // GOODS DETAILS
    // ==========================================

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("GOODS DETAILS");

    doc.moveDown(0.5);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Item Name: ${booking.itemName || "-"}`);

    doc.text(`Quantity: ${booking.quantity || 0}`);

    doc.moveDown(1);

    // ==========================================
    // CHARGES
    // ==========================================

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("CHARGES");

    doc.moveDown(0.5);

    const charges = [
        ["Crossing", booking.crossing],
        ["Freight", booking.freight],
        ["Hamali", booking.hamali],
        ["Bilty Charge", booking.biltyCharge],
        ["Other Charges", booking.otherCharges],
    ];

    charges.forEach(([label, amount]) => {
        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                `${label}: ${formatAmount(amount)}`
            );
    });

    doc.moveDown(0.5);

    // ==========================================
    // TOTAL
    // ==========================================

    doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
            `TOTAL AMOUNT: ${formatAmount(
                booking.totalAmount
            )}`
        );

    doc.moveDown(1);

    // ==========================================
    // PAYMENT DETAILS
    // ==========================================

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("PAYMENT DETAILS");

    doc.moveDown(0.5);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            `Payment Status: ${booking.paymentStatus || "-"
            }`
        );

    doc.text(
        `Paid Amount: ${formatAmount(
            booking.paidAmount
        )}`
    );

    doc.text(
        `Remaining Amount: ${formatAmount(
            booking.remainingAmount
        )}`
    );

    doc.moveDown(1);

    // ==========================================
    // BOOKING STATUS
    // ==========================================

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
            `Booking Status: ${booking.status || "-"
            }`
        );

    // ==========================================
    // NOTES
    // ==========================================

    if (booking.notes) {
        doc.moveDown(1);

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Notes");

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(booking.notes);
    }

    // ==========================================
    // SIGNATURES
    // ==========================================

    doc.moveDown(3);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Sender Signature", 60);

    doc.text("Receiver Signature", 230);

    doc.text("Authorized Signature", 400);

    // ==========================================
    // FOOTER
    // ==========================================

    doc
        .fontSize(8)
        .text(
            "This is a computer-generated booking/bilty document.",
            40,
            760,
            {
                width: 515,
                align: "center",
            }
        );
};

/**
 * Generate Single Booking PDF
 */
const generateBookingPdf = (booking, res) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 40,
    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `inline; filename="Bilty-${booking.bookingNumber}.pdf"`
    );

    doc.pipe(res);

    drawBilty(doc, booking);

    doc.end();
};

/**
 * Generate Bulk Booking PDF
 */
export const generateBulkBookingPdf = (
    bookings,
    res
) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 40,
    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        'inline; filename="Mahakal-Transport-Bilty-Bulk.pdf"'
    );

    doc.pipe(res);

    bookings.forEach((booking, index) => {
        // Add new page before every booking except first
        if (index > 0) {
            doc.addPage();
        }

        drawBilty(doc, booking);
    });

    doc.end();
};

export default generateBookingPdf;