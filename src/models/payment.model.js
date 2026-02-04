const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit',
      required: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },

    // Détails de la facture
    details: [
      {
        type: {
          type: String,
          enum: ['consultation', 'analyse', 'hospitalisation', 'medicament', 'operation', 'autre'],
          required: true
        },
        description: String,
        reference: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        referenceModel: {
          type: String,
          enum: ['Visit', 'Analysis', 'Hospitalisation', 'Operation', 'Other'],
          required: true
        },
        amount: { type: Number, required: true }
      }
    ],

    // MONTANTS
    totalAmount: { type: Number, required: true },

    // RÉDUCTION
    hasDiscount: { type: Boolean, default: false },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountReason: String, 

    finalAmount: { type: Number},

    paidAmount: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    // DETTE
    hasDebt: { type: Boolean, default: false },
    debtStatus: {
      type: String,
      enum: ['aucune', 'active', 'soldee'],
      default: 'aucune'
    },

    // REMBOURSEMENTS
    repayments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        paymentMethod: {
          type: String,
          enum: ['especes', 'mobile_money'],
          default: 'especes'
        },
        validatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        receipt: String,
        notes: String
      }
    ],

    paymentMethod: {
      type: String,
      enum: ['especes', 'mobile_money'],
      default: 'especes'
    },

    status: {
      type: String,
      enum: ['paye', 'partiel', 'impaye']
      //required: true
    },

    // VERSEMENTS INITIAUX
    installments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        paymentMethod: String,
        validatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        receipt: String
      }
    ],

    paymentDate: { type: Date },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    receipt: String,
    notes: String,
    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

  },
  { timestamps: true }
);

paymentSchema.pre('save', function() {
  // Calculer la réduction si nécessaire
  if (this.discountPercentage > 0) {
    this.hasDiscount = true;
    this.discountAmount = Math.round((this.totalAmount * this.discountPercentage) / 100);
  } else {
    this.hasDiscount = false;
    this.discountAmount = 0;
  }

  // Montant final à payer après réduction
  this.finalAmount = this.totalAmount - this.discountAmount;

  // Si paidAmount est défini, calculer le reste
  this.remainingAmount = (this.paidAmount || 0) ? this.finalAmount - this.paidAmount : this.finalAmount;

  // Gestion de la dette
  this.hasDebt = this.remainingAmount > 0;
  this.debtStatus = this.hasDebt ? 'active' : 'soldee';

  // Statut paiement
  if (!this.paidAmount || this.paidAmount <= 0) this.status = 'impaye';
  else if (this.remainingAmount > 0) this.status = 'partiel';
  else this.status = 'paye';
});


module.exports = mongoose.model('Payment', paymentSchema);