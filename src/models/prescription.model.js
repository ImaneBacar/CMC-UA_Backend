const mongoose = require("mongoose")
const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    medications: [
      {
        name: String,
        dosage: String,
        form: String,           
        frequency: String,      
        duration: String,      
        quantity: Number,
        instructions: String    
      }
    ],

    prescriptionDate: {
      type :Date,
      default:Date.now
    },
    
    expiryDate: Date,           
    notes: String              
  },
  { timestamps: true }
)

module.exports = mongoose.model('Prescription', prescriptionSchema)
