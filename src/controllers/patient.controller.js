const Patient = require("../models/patient.model");
const MedicalRecord = require("../models/medicalRecord.model")
const {generateNumeroPatient} = require('../utils/generateNumero')

const createPatient = async (req,res) => {

    try {
    
        const patientNumber= await generateNumeroPatient();
        const patientData = {...req.body,patientNumber};
        patientData.createdBy = req.user.id;

        const newPatient = new Patient(patientData);
        const savedPatient =  await newPatient.save();

        const newMedicalRecord = new MedicalRecord({
            patient:savedPatient._id,
        })
        
        await newMedicalRecord.save();
       
        return res.status(201).json({
             message: "Patient créé avec succès",
             patient: savedPatient,
             medicalRecord: newMedicalRecord
                });

    } catch (error) {
        console.error("Erreur création patient/dossier:", error);
        res.status(500).json({ message: "Erreur lors de la création", error: error.message });
    }
}

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("createdBy", "fullname email")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Liste des patients", data: patients });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("createdBy", "fullname email");

    if (!patient) return res.status(404).json({ message: "Patient non trouvé" });

    const medicalRecord = await MedicalRecord.findOne({ patient: patient._id });

    res.status(200).json({ patient, medicalRecord });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) return res.status(404).json({ message: "Patient non trouvé" });

    res.status(200).json({ message: "Patient mis à jour", patient: updatedPatient });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    const patients = await Patient.find({
      fullname: { $regex: query, $options: "i" }
    });
    res.status(200).json({ data: patients });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


module.exports={createPatient , getAllPatients,getPatientById,updatePatient,searchPatients}