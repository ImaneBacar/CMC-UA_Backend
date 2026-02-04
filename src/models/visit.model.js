const mongoose = require('mongoose')

const visitSchema = new mongoose.Schema(
  {
    visitNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },

    speciality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speciality',
      required: true
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required:true
    },

    visitReason: {
      type: String,
      required: true
    },

    visitType: {
      type: String,
      enum: ['consultation', 'urgence', 'suivi'],
      default: 'consultation'
    },

    visitDate: {
      type: Date,
      default: Date.now
    },

    arrivalTime: Date,
    startTime: Date,
    endTime: Date,
    paymentTime: Date,
    departureTime: Date,

    // MÉDICAL
    symptoms: String,
    examinations: String,
    diagnosis: String,
    observations: String,
    recommendations: String,

    vitalSigns: {
      temperature: Number,
      bloodPressure: String,
      pulse: Number,
      respiratoryRate: Number,
      weight: Number,
      height: Number,
      bmi: Number
    },

    prescriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
      }
    ],

    analyses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Analysis'
      }
    ],

    status: {
      type: String,
      enum: [
        'en attente de consultation',
        'en consultation',
        'en attente de résultats',
        'en attente de paiement',
        'terminé',
        'terminé avec dette',
        'annulé'
      ],
      default: 'en attente'
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },

    totalAmount: Number,

    isPaid: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    priority: {
      type: String,
      enum: ['normal', 'urgent', 'critique'],
      default: 'normal'
    },

    notes: String,

    nextVisit: {
      date: Date,
      reason: String,
      specialty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speciality'
      }
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Visit', visitSchema)
