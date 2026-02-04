const express = require("express");
const router = express.Router();

// Controllers
const { createSpeciality, getAllSpecialities, toggleSpecialityStatus,updateSpeciality } = require("../controllers/speciality.controller");

const { getAllUsers,createUser,getMyProfile,toggleUserStatus,updateMyProfile} = require("../controllers/user.controller");

const { registerUser, loginUser, changePassword } = require("../controllers/Auth");

const { createVisit, getAllVisits, getVisitById,updateVisit,getVisitsToday,finishVisit,getMyVisitsToday} = require("../controllers/visit.controller");

const { createPatient, getAllPatients, getPatientById, updatePatient, searchPatients } = require("../controllers/patient.controller");

const { createPrescription,getAllPrescriptions, getPrescriptionById, updatePrescription, deletePrescription} = require("../controllers/prescription.controller");

const {  
  createAnalysis,
  getAllAnalyses,
  getAnalysisById,
  startAnalysis,
  updateAnalysisResults,
  validateAnalysis,
  uploadAnalysisFile,
  downloadAnalysisFile,
  deleteAnalysisFile,
  getLabDashboard,
  upload  
} = require("../controllers/analysis.controller");

const {
  scheduleOperation,
  updatePayment,
  startOperation,
  completeOperation,
  cancelOperation,
  getMyOperations,
  getAllOperations,
  getDoctorDashboard,
  getPaymentDashboard,
  getPatientMedicalHistory
} = require("../controllers/operation.controller");

const { getAllPayments, updatePayment: updatePaymentDetails } = require("../controllers/payment.controller");

const { getMedicalRecordByPatient,updateMedicalRecord } = require("../controllers/medicalRecord.controller");

const authorize = require("../middlewares/Authorization");


// AUTHENTIFICATION
// Enregistre un nouvel utilisateur
router.post('/register', authorize(["admin"]), registerUser);
// Connexion utilisateur
router.post('/login', loginUser);
// Changement de mot de passe
router.post('/change-password', authorize([]), changePassword);


// UTILISATEURS
// Récupère tous les utilisateurs
router.get('/users',authorize(['admin']), getAllUsers);
// Créer un utilisateur
router.post('/users', authorize(['admin']), createUser);
// Mon profil
router.get('/users/profile', authorize([]), getMyProfile);
// Mettre à jour mon profil
router.put('/users/profile', authorize([]), updateMyProfile);
// Active ou désactive un utilisateur
router.put('/users/:id/status', authorize(['admin']), toggleUserStatus);


// SPÉCIALITÉS
// Récupère toutes les spécialités
router.get('/specialities', getAllSpecialities);
// Crée une nouvelle spécialité
router.post('/speciality', authorize(['admin', 'secretaire']), createSpeciality);
// Met à jour les informations d'une spécialité
router.patch('/specialities/:id', authorize(['admin']), updateSpeciality);
// Active ou désactive une spécialité existante
router.put('/speciality/:id/status', authorize(['admin']), toggleSpecialityStatus);


// PATIENTS
// Crée un nouveau patient et son dossier médical
router.post('/patient', authorize(['secretaire', 'medecin']), createPatient);
// Récupère tous les patients
router.get('/patients', authorize([]), getAllPatients);
// Recherche des patients par nom ou autre critère
router.get('/patients/search', authorize(['secretaire','medecin']), searchPatients);
// Récupère un patient par son ID
router.get('/patients/:id', authorize(['secretaire','medecin']), getPatientById);
// Met à jour un patient existant
router.put('/patients/:id', authorize(['secretaire', 'medecin']), updatePatient);


// VISITES
// Créer une visite avec paiement
router.post('/visit', authorize(['secretaire', 'medecin' ]), createVisit);
// Récupérer toutes les visites
router.get('/visits', authorize(['secretaire']), getAllVisits);
// Récupérer les visites du jour
router.get('/visits/today/all', authorize(['secretaire']), getVisitsToday);
// Récupérer mes visites du jour
router.get('/visits/today/mine', authorize(['medecin']), getMyVisitsToday);
// Récupérer une visite par ID
router.get('/visits/:id', authorize([]), getVisitById);
// Mettre à jour une visite
router.put('/visits/:id', authorize(['medecin', 'secretaire', 'admin']), updateVisit);
// Terminer une visite
router.patch('/visits/:id/finish', authorize(['medecin']), finishVisit);


// PRESCRIPTIONS
// Créer une prescription
router.post('/prescriptions', authorize(['medecin']), createPrescription);
// Récupérer toutes les prescriptions
router.get('/prescriptions', authorize([]), getAllPrescriptions);
// Récupérer une prescription par ID
router.get('/prescriptions/:id', authorize([]), getPrescriptionById);
// Mettre à jour une prescription
router.put('/prescriptions/:id', authorize(['medecin']), updatePrescription);
// Supprimer une prescription
router.delete('/prescriptions/:id', authorize(['medecin', 'admin']), deletePrescription);


// ANALYSES - SECTION MISE À JOUR
// Créer une analyse avec paiement
router.post('/analysis', authorize(['secretaire', 'medecin']), createAnalysis);

// Récupérer toutes les analyses
router.get('/analyses', authorize([]), getAllAnalyses);

// Dashboard laborantin
router.get('/analyses/lab/dashboard', authorize(['laborantin']), getLabDashboard);

// Récupérer une analyse par ID
router.get('/analyses/:id', authorize([]), getAnalysisById);

// Démarrer une analyse (Laborantin)
router.patch('/analyses/:id/start', authorize(['laborantin']), startAnalysis);

// Saisir les résultats (Laborantin)
router.patch('/analyses/:id/results', authorize(['laborantin']), updateAnalysisResults);

// Valider une analyse (Médecin)
router.patch('/analyses/:id/validate', authorize(['medecin']), validateAnalysis);

// Uploader un fichier (Laborantin/Admin)
router.post('/analyses/:id/upload', 
  authorize(['laborantin', 'admin']), 
  upload.single('file'),
  uploadAnalysisFile
);

// Télécharger le fichier (Tous les utilisateurs authentifiés)
router.get('/analyses/:id/download', 
  authorize([]), 
  downloadAnalysisFile
);

// Supprimer le fichier (Laborantin/Admin uniquement)
router.delete('/analyses/:id/file', 
  authorize(['laborantin', 'admin']), 
  deleteAnalysisFile
);


// OPÉRATIONS
// Programmer une opération
router.post('/operations', authorize(['medecin', 'secretaire']), scheduleOperation);
// Mes opérations
router.get('/operations/my-operations', authorize(['medecin']), getMyOperations);
// Dashboard médecin opérations du jour, à venir, en cours
router.get('/operations/doctor-dashboard', authorize(['medecin']), getDoctorDashboard);
// Dashboard paiements (secrétaire/comptable)
router.get('/operations/payment-dashboard', authorize(['secretaire', 'comptable']), getPaymentDashboard);
// Toutes les opérations (secrétaire/admin)
router.get('/operations/all', authorize(['secretaire']), getAllOperations);
// Démarrer une opération
router.patch('/operations/:id/start', authorize(['medecin']), startOperation);
// Terminer une opération
router.patch('/operations/:id/complete', authorize(['medecin']), completeOperation);
// Annuler une opération 
router.patch('/operations/:id/cancel', authorize(['secretaire', 'medecin']), cancelOperation);
// Mettre à jour le paiement d'une opération
router.patch('/operations/payment/:id', authorize(['secretaire', 'comptable']), updatePayment);


// PAIEMENTS
// Récupérer tous les paiements
router.get('/payments', authorize(['secretaire', 'comptable']), getAllPayments);
// Mettre à jour un paiement 
router.put('/payments/:id', authorize(['secretaire', 'comptable']), updatePaymentDetails);


// DOSSIER MÉDICAL
// Récupérer le dossier médical d'un patient
router.get('/medical-records/patient/:patientId', authorize(['secretaire', 'medecin']), getMedicalRecordByPatient);
// Historique complet des opérations d'un patient
router.get('/medical-records/patient/:patientId/operations', authorize(['secretaire', 'medecin']), getPatientMedicalHistory);
// Mettre à jour le dossier médical
router.put('/medical-records/:id', authorize(['medecin']), updateMedicalRecord);


// Route de test pour vérifier que l'API fonctionne
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API Clinique fonctionnelle',
    timestamp: new Date().toISOString()
  });
});


module.exports = router;