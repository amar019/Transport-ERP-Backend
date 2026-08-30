import Customer from "./cutomer.model.js";

/**
 * Generate next customer code
 * Example: CUS-0001, CUS-0002
 */
const generateCustomerCode = async () => {
    const lastCustomer = await Customer.findOne()
        .sort({ createdAt: -1 })
        .select("customerCode");

    if (!lastCustomer || !lastCustomer.customerCode) {
        return "CUS-0001";
    }

    const lastNumber = parseInt(
        lastCustomer.customerCode.replace("CUS-", ""),
        10
    );

    const nextNumber = lastNumber + 1;

    return `CUS-${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Create Customer
 */
export const createCustomer = async (customerData) => {
    const customerCode = await generateCustomerCode();

    const customer = await Customer.create({
        ...customerData,
        customerCode,
    });

    return customer;
};

/**
 * Get All Customers
 */
export const getAllCustomers = async () => {
    const customers = await Customer.find()
        .sort({ createdAt: -1 });

    return customers;
};

/**
 * Get Customer By ID
 */
export const getCustomerById = async (id) => {
    const customer = await Customer.findById(id);

    return customer;
};

/**
 * Update Customer
 */
export const updateCustomer = async (
    customerId,
    customerData
) => {
    const customer = await Customer.findByIdAndUpdate(
        customerId,
        customerData,
        {
            new: true,
            runValidators: true,
        }
    );

    return customer;
};

/**
 * Deactivate Customer
 */
export const deactivateCustomer = async (customerId) => {
    const customer = await Customer.findByIdAndUpdate(
        customerId,
        {
            status: "INACTIVE",
        },
        {
            new: true,
        }
    );

    return customer;
};

/**
 * Activate Customer
 */
export const activateCustomer = async (customerId) => {
    const customer = await Customer.findByIdAndUpdate(
        customerId,
        {
            status: "ACTIVE",
        },
        {
            new: true,
        }
    );

    return customer;
};