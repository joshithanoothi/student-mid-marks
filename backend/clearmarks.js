const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('midmarks').deleteMany({});
  console.log('✅ All mid marks cleared. Re-enter marks from faculty panel.');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });