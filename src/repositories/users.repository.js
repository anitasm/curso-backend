const User = require('../models/User');
const { normalize, persist } = require('./persistence');
const PUBLIC_FIELDS = 'firstName lastName email role createdAt updatedAt';
class UsersRepository {
  initialize() { return persist(() => User.init()); }
  list({ page, limit }) {
    return persist(async () => {
      const [rows, count] = await Promise.all([
        User.find().select(PUBLIC_FIELDS).sort({ _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        User.countDocuments(),
      ]);
      const totalPages = Math.max(1, Math.ceil(count / limit));
      return { docs: rows.map(normalize), page, totalPages, hasPrevPage: page > 1, hasNextPage: page < totalPages, prevPage: page > 1 ? page - 1 : null, nextPage: page < totalPages ? page + 1 : null };
    });
  }
  get(id) { return persist(async () => normalize(await User.findById(id).select(PUBLIC_FIELDS).lean())); }
  create(data) { return persist(async () => normalize(await User.create(data))); }
  update(id, data) { return persist(async () => normalize(await User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select(PUBLIC_FIELDS).lean())); }
  remove(id) { return persist(async () => normalize(await User.findByIdAndDelete(id).select(PUBLIC_FIELDS).lean())); }
}
module.exports = UsersRepository;
