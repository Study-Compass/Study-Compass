const mongoose = require('mongoose');

/**
 * A city's house voice for the carousel — the static copy that reads the same
 * in every issue: section slugs, "meanwhile", the receipt footer, the whole
 * back cover.
 *
 * Deliberately not part of pivotCopyPack. The copy pack is the product's own
 * voice, edited by people tuning the app; this is a publication's style sheet,
 * edited from inside the carousel. Keeping them apart means neither shows up in
 * the other's catalog.
 *
 * `entries` is a sparse map of manifest voice key -> override. A key absent
 * here falls back to the manifest's shipped default, which is why there is no
 * seeding step and no migration when a key is added.
 */
const pivotCarouselVoiceSchema = new mongoose.Schema(
  {
    tenantKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    entries: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    updatedBy: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

pivotCarouselVoiceSchema.pre('validate', function normalizeFields() {
  if (this.tenantKey) this.tenantKey = String(this.tenantKey).trim().toLowerCase();
});

module.exports = pivotCarouselVoiceSchema;
