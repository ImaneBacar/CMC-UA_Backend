const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    operationNumber: {
      type: String,
      unique: true,
      required: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit',
      required: true
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },

    // INFORMATIONS SUR L'OPÉRATION
    title: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ['mineure', 'majeure', 'urgence'],
      default: 'mineure'
    },

    description: String,

    surgeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    assistant: String,
    anesthetist: String,
    anesthesiaType: {
      type: String,
      enum: ['generale', 'locale', 'rachidienne', 'peridurale', 'sedation']
    },

    // PLANIFICATION
    scheduledDate: Date, // Date prévue
    scheduledStartTime: String, // Ex: "08:00"
    scheduledDuration: Number, // Durée prévue en minutes

    // RÉALISATION
    actualDate: Date, // Date réelle
    startTime: String,
    endTime: String,
    actualDuration: Number, // Calculé automatiquement

    // RAPPORT
    preOperativeReport: String, // Rapport pré-opératoire
    operativeReport: String, // Compte-rendu opératoire
    postOperativeReport: String, // Suivi post-opératoire

    complications: String,
    recommendations: String,

    // STATUT
    status: {
      type: String,
      enum: [
        'en_attente_de_paiement', 
        'programmee',             
        'en_cours',               
        'terminee',               
        'annulee'        
      ],
      default: 'en_attente_de_paiement'
    },


    // COÛT ET PAIEMENT
    cost: {
      type: Number,
      required: true
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    // NOTES
    notes: String,

    // TRAÇABILITÉ
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    cancelledReason: String
  },
  { timestamps: true }
);

// Calculer la durée réelle
operationSchema.pre('save', function() {
  if (this.startTime && this.endTime && !this.actualDuration) {
    // Convertir les heures en minutes
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    this.actualDuration = endMinutes - startMinutes;
  }
});

module.exports = mongoose.model('Operation', operationSchema);