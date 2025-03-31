const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BadgeGrantSchema = new mongoose.Schema({
  badgeContent: { type: String, required: true },
  badgeColor: { type: String, required: true },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  hash: { type: String, required: true, unique: true, default: uuidv4 },
});

module.exports = BadgeGrantSchema;
