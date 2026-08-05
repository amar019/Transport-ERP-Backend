import Booking from "./booking.model.js";
import ApiError from "../../utils/ApiErrors.js";
import PDFDocument from "pdfkit";
import { drawBilty } from "./booking.pdf.js";
import Customer from "../customer/cutomer.model.js";
import { calculatePaymentDetails } from "../../utils/payment.helper.js"

/* pdf generate */
export const generateBookingPdfService = async (bookingId) => {
    // 1. Find booking
    const booking = await Booking.findById(bookingId).populate(
        "customer",
        "customerCode shopName ownerName mobile email address area city district state pincode"
    );

    // 2. Check booking
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // 3. Convert MongoDB document to plain object
    const bookingData = booking.toObject();

    // 4. Generate PDF buffer using pdfkit
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve({
                pdfBuffer,
                bookingNumber: booking.bookingNumber || "Bilty",
            });
        });
        doc.on("error", (err) => reject(err));

        drawBilty(doc, bookingData);
        doc.end();
    });
};

/**
 * Generate next booking number
 * Example: BK-0001, BK-0002
 */
const generateBookingNumber = async () => {
    const lastBooking = await Booking.findOne()
        .sort({ createdAt: -1 })
        .select("bookingNumber");

    if (!lastBooking || !lastBooking.bookingNumber) {
        return "BK-0001";
    }

    const lastNumber = parseInt(
        lastBooking.bookingNumber.replace("BK-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `BK-${String(nextNumber).padStart(4, "0")}`;
};


/**
 * Create Booking
 */
export const createBooking = async (bookingData) => {

    // Check customer exists
    const customer = await Customer.findById(
        bookingData.customer
    );

    if (!customer) {
        throw new ApiError(
            404,
            "Customer not found"
        );
    }

    // Generate booking number
    const bookingNumber =
        await generateBookingNumber();

    const parcelCharge =
        Number(bookingData.parcelCharge || 0);

    // Calculate total charges
    const crossing =
        Number(bookingData.crossing || 0);

    const freight =
        Number(bookingData.freight || 0);

    const hamali =
        Number(bookingData.hamali || 0);

    const biltyCharge =
        Number(bookingData.biltyCharge || 0);

    const otherCharges =
        Number(bookingData.otherCharges || 0);


    const totalAmount =
        parcelCharge +
        crossing +
        freight +
        hamali +
        biltyCharge +
        otherCharges;

    const payment = calculatePaymentDetails(
        bookingData.collectionType,
        totalAmount
    );

    // Create booking
    const booking = await Booking.create({
        ...bookingData,
        bookingNumber,
        totalAmount,
        ...payment,
    });

    return booking;
};


/**
 * Get All Bookings
 */
export const getAllBookings = async () => {

    const bookings = await Booking.find()
        .populate(
            "customer",
            "customerCode shopName ownerName mobile"
        )
        .sort({ createdAt: -1 });

    return bookings;
};


/**
 * Get Booking By ID
 */
export const getBookingById = async (bookingId) => {

    const booking = await Booking.findById(
        bookingId
    ).populate(
        "customer",
        "customerCode shopName ownerName mobile"
    );

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found"
        );
    }

    return booking;
};


/**
 * Update Booking
 */
export const updateBooking = async (
    bookingId,
    bookingData
) => {

    const booking =
        await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found"
        );
    }

    // Update charges if provided

    const parcelCharge =
        Number(bookingData.parcelCharge || 0);

    const crossing =
        bookingData.crossing ??
        booking.crossing;

    const freight =
        bookingData.freight ??
        booking.freight;

    const hamali =
        bookingData.hamali ??
        booking.hamali;

    const biltyCharge =
        bookingData.biltyCharge ??
        booking.biltyCharge;

    const otherCharges =
        bookingData.otherCharges ??
        booking.otherCharges;

    // Recalculate Total Amount
    const totalAmount =
        Number(parcelCharge) +
        Number(crossing) +
        Number(freight) +
        Number(hamali) +
        Number(biltyCharge) +
        Number(otherCharges);

    // Calculate Payment Details
    const payment = calculatePaymentDetails(
        bookingData.collectionType,
        totalAmount
    );

    // Update Booking
    booking.set({
        ...bookingData,
        totalAmount,
        ...payment,
    });

    await booking.save();

    return booking;
};


/**
 * Cancel Booking
 */
export const cancelBooking = async (
    bookingId
) => {

    const booking =
        await Booking.findByIdAndUpdate(
            bookingId,
            {
                status: "CANCELLED",
            },
            {
                new: true,
            }
        );

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found"
        );
    }

    return booking;
};



/**
 * Delete Booking
 *
 * Only BOOKED and CANCELLED bookings can be deleted.
 * DELIVERED and IN_TRANSIT bookings cannot be deleted.
 */
export const deleteBooking = async (bookingId) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found"
        );
    }

    // Allow deletion only for BOOKED or CANCELLED bookings
    if (
        booking.status !== "BOOKED" &&
        booking.status !== "CANCELLED"
    ) {
        throw new ApiError(
            400,
            `Booking cannot be deleted because its current status is ${booking.status}`
        );
    }

    await Booking.findByIdAndDelete(bookingId);

    return booking;
};