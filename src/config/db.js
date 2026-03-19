const mongoose = require("mongoose");

const connectDB = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("La variable de entorno MONGO_URI es obligatoria para conectar con MongoDB Atlas");
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conexión exitosa a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB Atlas:", error.message);
    throw error;
  }
};

module.exports = connectDB;