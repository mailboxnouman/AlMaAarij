const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true }, // Keep googleId as unique
  displayName: { type: String, required: true }, // Change username to displayName
  password: { type: String }, // Make password optional for Google users
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Password verification method
UserSchema.methods.isValidPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
