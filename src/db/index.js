// config/db.js
import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ETIMEOUT by setting reliable Google DNS servers for SRV resolution
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Connection Error: ${error.message}`);
    process.exit(1); // stop app if DB fails
  }
};

export default connectDB;