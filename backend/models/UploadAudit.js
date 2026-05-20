const mongoose = require("mongoose");

const UploadAuditSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalRows: { type: Number, default: 0 },
  successRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  mode: { type: String, enum: ["partial", "all_or_nothing"], default: "partial" },
  status: { type: String, enum: ["Success", "Failed", "RolledBack"], default: "Success" }
}, { timestamps: true });

module.exports = mongoose.model("UploadAudit", UploadAuditSchema);
