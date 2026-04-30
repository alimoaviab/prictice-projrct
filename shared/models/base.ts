export const tenantField = {
  type: String,
  required: true,
  index: true,
  immutable: true,
  trim: true
};

export const schemaOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  versionKey: false
} as const;

export const requiredString = {
  type: String,
  required: true,
  trim: true
};
