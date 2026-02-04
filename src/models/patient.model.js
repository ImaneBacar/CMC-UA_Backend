const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema(
  {
    patientNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    fullname: {
      type: String,
      required: true,
      trim: true
    }
    ,
    dateOfBirth: {
      type: Date,
      required: true
    },

    gender: {
      type: String,
      enum: ['M', 'F'],
      required: true
    },

    nationality: {
      type: String,
      default: 'Comorien'
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      type: String
    },

    city: {
      type: String
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'inconnu']
    },

    allergies: {
      type: [String]
    },

    chronicDiseases: {
      type: [String]
    },

    medicalHistory: {
      type: String
    },

    surgicalHistory: {
      type: String
    },

    currentTreatments: {
      type: [String]
    },

    emergencyContact: {
      fullname: { type: String },
      phone: {
        type: String,
        required: function () {
          return this.emergencyContact != null
        }
      },
      relationship: {
        type: String
      }
    },

    nationalIdNumber: {
      type: String
    },

    insuranceNumber: {
      type: String
    },

    profession: {
      type: String
    },

    employer: {
      type: String
    },

    status: {
      type: String,
      enum: ['actif', 'inactif', 'décédé'],
      default: 'actif'
    },

    origin: {
      type: String,
      enum: ['local', 'diaspora'],
      default: 'local'
    },

    notes: {
      type: String
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

patientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null

  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age
})

module.exports = mongoose.model('Patient', patientSchema)
