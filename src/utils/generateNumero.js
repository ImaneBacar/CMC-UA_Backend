
const Counter = require('../models/counter.model');

async function getNextSequence(sequenceName) {
  const counter = await Counter.findByIdAndUpdate( sequenceName,{ $inc: { seq: 1 } }, { new: true, upsert: true });
  return counter.seq;
}

// Générer numéro patient
async function generateNumeroPatient() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`patient_${year}`);
  return `PAT-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro visite
async function generateNumeroVisite() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`visite_${year}`);
  return `VIS-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro analyse
async function generateNumeroAnalyse() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`analyse_${year}`);
  return `ANA-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro paiement
async function generateNumeroPaiement() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`paiement_${year}`);
  return `PAY-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro prescription
async function generateNumeroPrescription() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`prescription_${year}`);
  return `PRESC-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro dette
async function generateNumeroDette() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`dette_${year}`);
  return `DET-${year}-${String(seq).padStart(3, '0')}`;
}

// Générer numéro dette
async function generateNumeroOperation() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`operation_${year}`);
  return `OP-${year}-${String(seq).padStart(3, '0')}`;
}


module.exports = {
  generateNumeroPatient,
  generateNumeroVisite,
  generateNumeroAnalyse,
  generateNumeroPaiement,
  generateNumeroPrescription,
  generateNumeroDette,
  generateNumeroOperation
};