const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  },

  medicalHistory: { type: String, default: "" },
  surgicalHistory: { type: String, default: "" },
  familyHistory: { type: String, default: "" },

  allergies: { type: [String], default: [] },
  intolerances: { type: [String], default: [] },

  chronicDiseases: [{
    name: String,
    diagnosisDate: Date,
    currentTreatment: String,
    notes: String
  }],

  vaccinations: [{
    name: String,
    date: Date,
    boosterDate: Date,
    notes: String
  }],

  lifestyle: {
    smoker: { type: Boolean, default: false },
    cigarettesPerDay: { type: Number, default: 0 },
    alcohol: { type: String, default: "Aucun" },
    physicalActivity: { type: String, default: "Non précisée" },
    diet: { type: String, default: "Non précisée" }
  },

  visits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: [] }],
  prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: [] }],
  analyses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', default: [] }],

  importantNotes: { type: String, default: "" },
  alerts: { type: [String], default: [] },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
