const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants');
const schema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.USER, required: true },
}, { timestamps: true, versionKey: false });
module.exports = mongoose.models.User || mongoose.model('User', schema);
