const mongoose = require('mongoose');

const pivotDropPushRunSchema = new mongoose.Schema(
  {
    tenantKey: { type: String, required: true, trim: true, lowercase: true },
    batchWeek: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    body: { type: String, default: '', trim: true },
    attempted: { type: Number, required: true, min: 0 },
    accepted: { type: Number, required: true, min: 0 },
    failed: { type: Number, required: true, min: 0 },
    audience: {
      campus: { type: Number, default: 0 },
      justgo: { type: Number, default: 0 },
      legacy: { type: Number, default: 0 },
    },
    errors: { type: [String], default: [] },
    forced: { type: Boolean, default: false },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

pivotDropPushRunSchema.index({ tenantKey: 1, createdAt: -1 });
pivotDropPushRunSchema.index({ batchWeek: 1, createdAt: -1 });

module.exports = pivotDropPushRunSchema;
