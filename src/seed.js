import User from "./modules/user/user.model.js";

const seedUsers = async () => {
    const exists = await User.findOne({ username: "booking" });

    if (!exists) {
        await User.create([
            {
                name: "Booking Owner",
                username: "booking",
                password: "booking123",
                defaultBranch: "BOOKING",
            },
            {
                name: "Delivery Owner",
                username: "delivery",
                password: "delivery123",
                defaultBranch: "DELIVERY",
            },
        ]);

        console.log("Default users created.");
    } else {
        console.log("Users already exist.");
    }
};

export default seedUsers;