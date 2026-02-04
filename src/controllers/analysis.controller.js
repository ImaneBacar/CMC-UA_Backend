const Analysis = require('../models/analysis.model');
const Payment = require('../models/payment.model');
const MedicalRecord = require('../models/medicalRecord.model');
const Visit = require('../models/visit.model');
const { generateNumeroAnalyse, generateNumeroPaiement } = require('../utils/generateNumero');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/analyses');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const tempName = `temp-${Date.now()}${ext}`;
    cb(null, tempName);
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls PDF et Word sont acceptés.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// CRÉER UNE ANALYSE

const createAnalysis = async (req, res) => {
  try {
    const { 
      patient, 
      visit, 
      doctor, 
      category, 
      items, 
      priority, 
      discountPercentage = 0, 
      paidAmount = 0 
    } = req.body;

    // Validation
    if (!patient) {
      return res.status(400).json({ message: "Patient requis" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Au moins une analyse est requise" });
    }

    // Générer le numéro d'analyse
    const analysisNumber = await generateNumeroAnalyse();
    
    // Calculer le prix total
    const totalPrice = items.reduce((sum, i) => sum + i.price, 0);

    // Créer l'analyse
    const newAnalysis = await Analysis.create({
      analysisNumber,
      patient,
      visit,
      doctor,
      category,
      items,
      totalPrice,
      priority: priority || 'Normal',
      prescriptionDate: new Date(),
      status: 'en attente',
      createdBy: req.user.id
    });

    // Créer le paiement associé
    const discountAmount = Math.round((totalPrice * discountPercentage) / 100);
    const finalAmount = totalPrice - discountAmount;
    
    const payment = await Payment.create({
      paymentNumber: await generateNumeroPaiement(),
      visit,
      patient,
      details: [{
        type: 'analyse',
        description: `Analyse(s) prescrite(s) : ${category}`,
        reference: newAnalysis._id,
        referenceModel: 'Analysis',
        amount: totalPrice
      }],
      totalAmount: totalPrice,
      discountPercentage,
      discountAmount,
      finalAmount,
      paidAmount,
      remainingAmount: finalAmount - paidAmount,
      hasDebt: finalAmount - paidAmount > 0,
      debtStatus: finalAmount - paidAmount > 0 ? 'active' : 'soldee',
      status: paidAmount >= finalAmount ? 'paye' : (paidAmount > 0 ? 'partiel' : 'impaye'),
      createdBy: req.user.id
    });

    // Lier le paiement à l'analyse
    newAnalysis.payment = payment._id;
    await newAnalysis.save();

    // Ajouter à la visite si elle existe
    if (visit) {
      await Visit.findByIdAndUpdate(visit, {
        $push: { analyses: newAnalysis._id }
      });
    }

    // Ajouter dans le dossier médical
    let medicalRecord = await MedicalRecord.findOne({ patient });
    
    if (!medicalRecord) {
      medicalRecord = await MedicalRecord.create({
        patient,
        analyses: [newAnalysis._id]
      });
    } else {
      medicalRecord.analyses.push(newAnalysis._id);
      medicalRecord.updatedBy = req.user.id;
      await medicalRecord.save();
    }

    // Populate pour la réponse
    await newAnalysis.populate('patient doctor visit payment');

    res.status(201).json({
      message: 'Analyse prescrite et paiement créé avec succès',
      data: newAnalysis
    });

  } catch (error) {
    console.error('Erreur création analyse:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

//  RÉCUPÉRER TOUTES LES ANALYSES

const getAllAnalyses = async (req, res) => {
  try {
    const { status, category, patient, priority } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (patient) filter.patient = patient;
    if (priority) filter.priority = priority;
    
    // Si laborantin, voir seulement celles en attente ou en cours
    if (req.user.role.includes('laborantin')) {
      filter.status = { $in: ['en attente', 'en cours'] };
    }

    const analyses = await Analysis.find(filter)
      .populate('patient', 'fullname patientNumber')
      .populate('doctor', 'fullname')
      .populate('visit', 'visitNumber')
      .populate('technician', 'fullname')
      .populate('payment')
      .sort({ prescriptionDate: -1 });

    res.status(200).json({
      message: 'Liste des analyses',
      count: analyses.length,
      data: analyses
    });

  } catch (error) {
    console.error('Erreur récupération analyses:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// RÉCUPÉRER UNE ANALYSE PAR ID

const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findById(id)
      .populate('patient', 'fullname patientNumber dateOfBirth gender')
      .populate('doctor', 'fullname')
      .populate('visit', 'visitNumber visitDate')
      .populate('technician', 'fullname')
      .populate('payment');

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    res.status(200).json({
      message: 'Analyse trouvée',
      data: analysis
    });

  } catch (error) {
    console.error('Erreur récupération analyse:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// DÉMARRER UNE ANALYSE 
const startAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    if (analysis.status !== 'en attente') {
      return res.status(400).json({ 
        message: 'Analyse doit être en attente pour être démarrée' 
      });
    }

    analysis.status = 'en cours';
    analysis.processingDate = new Date();
    analysis.technician = req.user.id;

    await analysis.save();

    res.status(200).json({
      message: 'Analyse démarrée',
      data: analysis
    });

  } catch (error) {
    console.error('Erreur démarrage analyse:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// SAISIR LES RÉSULTATS 
const updateAnalysisResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, technicianComment } = req.body;

    const analysis = await Analysis.findById(id)
      .populate('patient', 'fullname patientNumber dateOfBirth gender')
      .populate('doctor', 'fullname');

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    if (analysis.status !== 'en cours') {
      return res.status(400).json({ 
        message: 'Analyse doit être en cours' 
      });
    }

    // Mettre à jour les items avec les résultats
    if (items && items.length > 0) {
      items.forEach(updatedItem => {
        const itemIndex = analysis.items.findIndex(
          item => item.name === updatedItem.name
        );
        
        if (itemIndex !== -1) {
          if (updatedItem.value !== undefined) {
            analysis.items[itemIndex].value = updatedItem.value;
          }
          if (updatedItem.interpretation !== undefined) {
            analysis.items[itemIndex].interpretation = updatedItem.interpretation;
          }
          if (updatedItem.notes !== undefined) {
            analysis.items[itemIndex].notes = updatedItem.notes;
          }
        }
      });
    }

    // Mettre à jour le statut et les dates
    analysis.status = 'terminé';
    analysis.resultDate = new Date();
    analysis.technicianComment = technicianComment || '';

    if (!analysis.technician) {
      analysis.technician = req.user.id;
    }

    await analysis.save();
    await analysis.populate('technician', 'fullname');

    res.status(200).json({
      message: 'Résultats enregistrés avec succès',
      data: analysis
    });

  } catch (error) {
    console.error('Erreur mise à jour résultats:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// VALIDER UNE ANALYSE

const validateAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorComment } = req.body;

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    if (analysis.status !== 'terminé') {
      return res.status(400).json({ 
        message: 'Analyse doit être terminée pour être validée' 
      });
    }

    analysis.status = 'validé';
    analysis.validationDate = new Date();
    analysis.doctorComment = doctorComment || '';

    await analysis.save();

    res.status(200).json({
      message: 'Analyse validée',
      data: analysis
    });

  } catch (error) {
    console.error('Erreur validation analyse:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// UPLOADER LE FICHIER PDF/WORD 

const uploadAnalysisFile = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      // Supprimer le fichier uploadé si l'analyse n'existe pas
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    // Vérifier que l'analyse est terminée ou en cours
    if (!['en cours', 'terminé', 'validé'].includes(analysis.status)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Impossible d\'uploader un fichier pour une analyse en attente' 
      });
    }

    // Supprimer l'ancien fichier s'il existe
    if (analysis.pdfResult && analysis.pdfResult.filename) {
      const oldFilePath = path.join(
        __dirname, 
        '../uploads/analyses', 
        analysis.pdfResult.filename
      );
      
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Renommer le fichier avec le numéro d'analyse
    const ext = path.extname(req.file.originalname);
    const newFilename = `${analysis.analysisNumber}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);

    // Renommer le fichier
    fs.renameSync(oldPath, newPath);

    // Sauvegarder les informations du fichier
    analysis.pdfResult = {
      url: `/uploads/analyses/${newFilename}`,
      filename: newFilename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    await analysis.save();

    res.status(200).json({
      message: 'Fichier uploadé avec succès',
      data: analysis
    });

  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Erreur upload fichier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// TÉLÉCHARGER LE FICHIER PDF/WORD

const downloadAnalysisFile = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    if (!analysis.pdfResult || !analysis.pdfResult.filename) {
      return res.status(404).json({ 
        message: 'Aucun fichier disponible pour cette analyse' 
      });
    }

    const filePath = path.join(
      __dirname, 
      '../uploads/analyses', 
      analysis.pdfResult.filename
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
    }

    // Télécharger le fichier avec son nom original
    res.download(
      filePath, 
      analysis.pdfResult.originalName || analysis.pdfResult.filename
    );

  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// SUPPRIMER LE FICHIER

const deleteAnalysisFile = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Analyse non trouvée' });
    }

    if (!analysis.pdfResult || !analysis.pdfResult.filename) {
      return res.status(404).json({ message: 'Aucun fichier à supprimer' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(
      __dirname, 
      '../uploads/analyses', 
      analysis.pdfResult.filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer les infos du fichier dans la BDD
    analysis.pdfResult = undefined;
    await analysis.save();

    res.status(200).json({
      message: 'Fichier supprimé avec succès',
      data: analysis
    });

  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// DASHBOARD LABORANTIN

const getLabDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pending, inProgress, completedToday] = await Promise.all([
      // Analyses en attente
      Analysis.find({ status: 'en attente' })
        .populate('patient', 'fullname patientNumber')
        .populate('doctor', 'fullname')
        .sort({ prescriptionDate: 1 }),

      // Analyses en cours (par ce laborantin)
      Analysis.find({ 
        status: 'en cours',
        technician: req.user.id 
      })
        .populate('patient', 'fullname patientNumber')
        .sort({ processingDate: 1 }),

      // Analyses terminées aujourd'hui
      Analysis.find({
        status: { $in: ['terminé', 'validé'] },
        resultDate: { $gte: today, $lt: tomorrow }
      })
        .populate('patient', 'fullname patientNumber')
        .populate('technician', 'fullname')
    ]);

    res.status(200).json({
      pending: {
        count: pending.length,
        data: pending
      },
      inProgress: {
        count: inProgress.length,
        data: inProgress
      },
      completedToday: {
        count: completedToday.length,
        data: completedToday
      }
    });

  } catch (error) {
    console.error('Erreur dashboard labo:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
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
};