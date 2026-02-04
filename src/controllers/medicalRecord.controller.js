const MedicalRecord = require('../models/medicalRecord.model');

// --- Récupérer le dossier médical d'un patient ---
const getMedicalRecordByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    let record = await MedicalRecord.findOne({ patient: patientId })
      .populate('visits')
      .populate('prescriptions')
      .populate('analyses');

    if (!record) {
      return res.status(404).json({ message: 'Dossier médical introuvable' });
    }

    res.status(200).json({ message: 'Dossier médical récupéré', record });
  } catch (error) {
    console.error('Erreur récupération dossier médical:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// --- Mettre à jour le dossier médical (allergies, antécédents, style de vie…) ---
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params; // ID du dossier médical
    const updates = req.body;

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user.id },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Dossier médical introuvable' });
    }

    res.status(200).json({ message: 'Dossier médical mis à jour', record: updatedRecord });
  } catch (error) {
    console.error('Erreur mise à jour dossier médical:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports={updateMedicalRecord,getMedicalRecordByPatient}