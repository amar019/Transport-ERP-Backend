import User from "./modules/user/user.model.js";
import Branch from "./modules/Branch/branch.model.js";

const seedUsers = async () => {
    try {
        // Ensure default branches exist
        let bookingBranch = await Branch.findOne({ type: "BOOKING" });
        if (!bookingBranch) {
            bookingBranch = await Branch.create({
                name: "Ahmednagar Booking",
                type: "BOOKING",
                status: "ACTIVE",
            });
            console.log("Default Booking Branch created:", bookingBranch.name);
        }

        let deliveryBranch = await Branch.findOne({ type: "DELIVERY" });
        if (!deliveryBranch) {
            deliveryBranch = await Branch.create({
                name: "Jamkhed Delivery",
                type: "DELIVERY",
                status: "ACTIVE",
            });
            console.log("Default Delivery Branch created:", deliveryBranch.name);
        }

        // Ensure default users exist
        const bookingUser = await User.findOne({ username: "booking" });
        if (!bookingUser) {
            await User.create({
                name: "Booking Owner",
                username: "booking",
                password: "booking123",
                branch: bookingBranch._id,
                status: "ACTIVE",
            });
            console.log("Default booking user created.");
        }

        const deliveryUser = await User.findOne({ username: "delivery" });
        if (!deliveryUser) {
            await User.create({
                name: "Delivery Owner",
                username: "delivery",
                password: "delivery123",
                branch: deliveryBranch._id,
                status: "ACTIVE",
            });
            console.log("Default delivery user created.");
        }

        console.log("Seed check completed successfully.");
    } catch (error) {
        console.error("Error running database seed:", error);
    }
};

export default seedUsers;