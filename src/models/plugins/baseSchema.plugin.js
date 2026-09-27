import mongoose from 'mongoose';

/**
 * Base schema plugin implementing:
 * - Timestamps (createdAt, updatedAt)
 * - Audit tracking (created_by, updated_by)
 * - Soft-delete pattern (is_deleted, deleted_at, deleted_by)
 * - Standard JSON serialization (transforms _id to id, removes __v)
 * - Query hooks to auto-exclude soft-deleted records unless explicitly requested
 *
 * @param {mongoose.Schema} schema
 * @param {object} [options={}]
 */
export const baseSchemaPlugin = (schema, options = {}) => {
  const {
    timestamps = true,
    audit = true,
    softDelete = true,
    userModelName = 'User',
  } = options;

  // Add Timestamps
  if (timestamps && !schema.get('timestamps')) {
    schema.set('timestamps', true);
  }

  // Add Audit fields
  if (audit) {
    schema.add({
      created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModelName,
        default: null,
      },
      updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModelName,
        default: null,
      },
    });
  }

  // Add Soft-Delete fields
  if (softDelete) {
    schema.add({
      is_deleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      deleted_at: {
        type: Date,
        default: null,
      },
      deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModelName,
        default: null,
      },
    });

    // Instance method: soft delete
    schema.methods.softDelete = async function (deletedBy = null) {
      this.is_deleted = true;
      this.deleted_at = new Date();
      if (deletedBy) {
        this.deleted_by = deletedBy;
      }
      return this.save();
    };

    // Instance method: restore soft-deleted doc
    schema.methods.restore = async function () {
      this.is_deleted = false;
      this.deleted_at = null;
      this.deleted_by = null;
      return this.save();
    };

    // Query helper to explicitly request deleted records
    schema.query.withDeleted = function () {
      return this.setOptions({ includeDeleted: true });
    };

    schema.query.onlyDeleted = function () {
      return this.where({ is_deleted: true });
    };

    // Pre-query middleware to automatically exclude deleted items
    const queryMethods = [
      'find',
      'findOne',
      'findOneAndUpdate',
      'count',
      'countDocuments',
    ];

    queryMethods.forEach((method) => {
      schema.pre(method, function () {
        const queryOptions = this.getOptions();
        // Skip filter if query explicitly specifies includeDeleted or is_deleted is already filtered
        if (queryOptions.includeDeleted) {
          return;
        }

        const filter = this.getFilter();
        if (filter.is_deleted === undefined) {
          this.where({ is_deleted: false });
        }
      });
    });
  }

  // Clean JSON Serialization options
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
};

/**
 * Helper to construct a standard Mongoose Schema pre-configured with base plugin options.
 *
 * @param {mongoose.SchemaDefinition} definition
 * @param {mongoose.SchemaOptions} [options={}]
 * @param {object} [pluginOptions={}]
 * @returns {mongoose.Schema}
 */
export const createBaseSchema = (definition, options = {}, pluginOptions = {}) => {
  const schema = new mongoose.Schema(definition, {
    timestamps: true,
    ...options,
  });

  schema.plugin(baseSchemaPlugin, pluginOptions);

  return schema;
};
