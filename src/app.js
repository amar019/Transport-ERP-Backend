import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoute from "./modules/user/user.routes.js"
import customerRoute from './modules/customer/customer.routes.js';
import bookingRoute from "./modules/Booking/booking.routes.js";
import memoRoutes from "./modules/memo/memo.routes.js";
import branchRoute from "./modules/Branch/branch.routes.js";
import expenseRoutes from "./modules/Expenses/expense.routes.js";
import paymentRoutes from "./modules/Payment/payment.routes.js";
import deliveryBoyRoutes from "./modules/DeliveryBoy/deliveryBoy.routes.js";
import deliveryBookingRoutes from "./modules/Deliverymanage/deliveryBooking.routes.js";
import customerLedgerRoutes from "./modules/customerLedger/customerLedger.routes.js";
import deliveryBoyLedgerRoutes from "./modules/deliveryboyLedger/deliveryBoyLedger.routes.js";
import paymentTransactionRoute from "./modules/paymentTransactions/paymentTransaction.route.js"
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import { swaggerUi, swaggerSpec } from "./docs/swagger.js";

const app = express();

// ── Middleware ──────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'https://transport-erp-frontend.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ── Routes for booking branch──────────────────────────────────────────────
app.use("/api/users", userRoute);
app.use("/api/customers", customerRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/memos", memoRoutes);
app.use("/api/branches", branchRoute);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);

//── Routes for delivery branch------------------------------------------------
app.use("/api/delivery-boys", deliveryBoyRoutes);
app.use(
  "/api/delivery/bookings",
  deliveryBookingRoutes
);

app.use("/api/customer-ledger", customerLedgerRoutes);
app.use(
  "/api/delivery-boy-ledger",
  deliveryBoyLedgerRoutes
);
app.use(
  "/api/payment-transactions",
  paymentTransactionRoute
);
app.use("/api/dashboard", dashboardRoutes);


// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;