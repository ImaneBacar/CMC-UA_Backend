const mongoose = require('mongoose')

const analysisItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    unit: {
      type: String
    },

    referenceRange: {
      type: String
    },

    value: {
      type: String
    },

    interpretation: {
      type: String
    },

    notes: {
      type: String
    }
  },
  { _id: false }
)

const analysisSchema = new mongoose.Schema(
  {
    analysisNumber: {
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

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    category: {
      type: String,
      enum: ['laboratoire', 'imagerie'],
      required: true
    },

    status: {
      type: String,
      enum: ['en attente', 'en cours', 'terminé', 'validé'],
      default: 'en attente'
    },

    priority: {
      type: String,
      enum: ['Normal', 'Urgent'],
      default: 'Normal'
    },

    prescriptionDate: {
      type: Date,
      required: true
    },

    processingDate: Date,
    resultDate: Date,
    validationDate: Date,

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    payment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Payment'
},

    items: {
      type: [analysisItemSchema],
      validate: [
        v => v.length > 0,
        'Au moins une analyse est requise'
      ]
    },

    totalPrice: {
      type: Number,
      default: 0
    },

    pdfResult: {
      url: String,
      filename: String,
      generatedAt: Date
    },

    technicianComment: String,
    doctorComment: String,

    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Analysis', analysisSchema)
