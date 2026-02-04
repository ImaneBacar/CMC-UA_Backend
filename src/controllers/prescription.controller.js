const Prescription = require('../models/prescription.model');
const Visit = require('../models/visit.model');
const MedicalRecord = require("../models/medicalRecord.model")
const { generateNumeroPrescription } = require('../utils/generateNumero');

const createPrescription = async (req, res) => {
  try {
    const { visit, patient, medications, notes } = req.body;

    const visitDoc = await Visit.findById(visit);
    if (!visitDoc) return res.status(404).json({ message: "Visite introuvable" });

    const prescriptionNumber = await generateNumeroPrescription();

    const prescriptionData = {
      prescriptionNumber,
      visit,
      patient,
      doctor: req.user._id,
      medications,
      prescriptionDate: new Date(),
      notes
    };

    const newPrescription = new Prescription(prescriptionData);
    await newPrescription.save();

    // Ajouter à la visite
    await Visit.findByIdAndUpdate(visit, { $push: { prescriptions: newPrescription._id } });

    // Ajouter au dossier médical
    await MedicalRecord.findOneAndUpdate(
      { patient },
      { $push: { prescriptions: newPrescription._id } },
      { new: true, upsert: true }  // crée le dossier si inexistant
    );

    res.status(201).json({
      message: "Prescription créée avec succès",
      prescription: newPrescription
    });
  } catch (error) {
    console.error("Erreur création prescription:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer toutes les prescriptions 
const getAllPrescriptions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.patient) filter.patient = req.query.patient;
    if (req.user.role === 'medecin') filter.doctor = req.user._id;

    const prescriptions = await Prescription.find(filter)
      .populate('visit', 'visitNumber visitDate')
      .populate('patient', 'fullname')
      .populate('doctor', 'fullname');

    res.status(200).json({ message: "Liste des prescriptions", prescriptions });
  } catch (error) {
    console.error("Erreur récupération prescriptions:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer une prescription par ID
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('visit', 'visitNumber visitDate')
      .populate('patient', 'fullname')
      .populate('doctor', 'fullname');

    if (!prescription) return res.status(404).json({ message: "Prescription introuvable" });

    // Vérification si le médecin ne peut voir que ses prescriptions
    if (req.user.role === 'medecin' && !prescription.doctor.equals(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé à cette prescription" });
    }

    res.status(200).json({ message: "Prescription trouvée", prescription });
  } catch (error) {
    console.error("Erreur récupération prescription:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Mettre à jour une prescription
const updatePrescription = async (req, res) => {
  try {
    const updates = req.body;

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription introuvable" });

    // Vérification si le médecin ne peut modifier que ses prescriptions
    if (req.user.role === 'medecin' && !prescription.doctor.equals(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé à cette prescription" });
    }

    Object.assign(prescription, updates);
    await prescription.save();

    res.status(200).json({ message: "Prescription mise à jour", prescription });
  } catch (error) {
    console.error("Erreur mise à jour prescription:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer une prescription 
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription introuvable" });

    // Supprimer la référence dans la visite
    await Visit.findByIdAndUpdate(prescription.visit, { $pull: { prescriptions: prescription._id } });

    res.status(200).json({ message: "Prescription supprimée", prescription });
  } catch (error) {
    console.error("Erreur suppression prescription:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};