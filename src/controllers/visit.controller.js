const Visit = require('../models/visit.model');
const Payment = require('../models/payment.model');
const MedicalRecord = require('../models/medicalRecord.model');

const { generateNumeroVisite ,generateNumeroPaiement} = require('../utils/generateNumero');


const createVisit = async (req, res) => {
  try {
    const visitNumber = await generateNumeroVisite();
    const totalAmount = req.body.totalAmount || 0;
    const discountPercentage = req.body.discountPercentage || 0;
    
    const discountAmount = Math.round((totalAmount * discountPercentage) / 100);
    const finalAmount = totalAmount - discountAmount;
    
    const paidAmount = req.body.paidAmount ?? finalAmount;
    
    if (paidAmount < finalAmount) {
      return res.status(400).json({
        message: 'Le paiement doit être complet avant de créer la visite',
        required: finalAmount,
        provided: paidAmount,
        missing: finalAmount - paidAmount
      });
    }

    const visitData = {
      patient: req.body.patient,
      speciality: req.body.speciality,
      doctor: req.body.doctor,
      visitReason: req.body.visitReason,
      visitType: req.body.visitType || 'consultation',
      visitNumber,
      createdBy: req.user.id,
      status: 'en attente de consultation',
      isPaid: true,
      totalAmount: finalAmount
    };

    const newVisit = new Visit(visitData);
    const savedVisit = await newVisit.save();

    // Créer le paiement 
    const paymentNumber = await generateNumeroPaiement();
    const paymentData = {
      visit: savedVisit._id,
      patient: savedVisit.patient,
      paymentNumber,
      totalAmount,
      discountPercentage,
      hasDiscount: discountPercentage > 0,
      paidAmount: finalAmount,
      createdBy: req.user.id,
      paymentMethod: req.body.paymentMethod || 'especes'
    };

    const newPayment = new Payment(paymentData);
    await newPayment.save();

    savedVisit.payment = newPayment._id;
    await savedVisit.save();

    await MedicalRecord.findOneAndUpdate(
      { patient: savedVisit.patient },
      { $push: { visits: savedVisit._id } },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: 'Visite et paiement créés avec succès',
      visit: savedVisit,
      payment: newPayment
    });

  } catch (error) {
    console.error('Erreur création visite/paiement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création', 
      error: error.message 
    });
  }
};

const getAllVisits = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Filtrer par médecin et sa spécialité si c'est un médecin connecté
    let filter = {};
    if (req.user.role === 'medecin') {
      filter.doctor = req.user._id;        // uniquement ses visites
      filter.speciality = req.user.speciality; // et sa spécialité
    }

    if (status) filter.status = status;
    if (startDate || endDate) filter.visitDate = {};
    if (startDate) filter.visitDate.$gte = new Date(startDate);
    if (endDate) filter.visitDate.$lte = new Date(endDate);

    const visits = await Visit.find(filter)
      .populate('patient', 'fullname dateOfBirth')
      .populate('speciality', 'name')
      .populate('doctor', 'fullname')
      .populate('payment');

    res.status(200).json({ message: "Liste des visites", visits });
  } catch (error) {
    console.error("Erreur récupération visites:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getVisitById = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('patient', 'fullname dateOfBirth')
      .populate('speciality', 'name')
      .populate('doctor', 'fullname')
      .populate('payment');

    if (!visit) {
      return res.status(404).json({ message: "Visite introuvable" });
    }

    // Vérification si le médecin ne peut voir que ses visites
    if (req.user.role === 'medecin' && !visit.doctor.equals(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé à cette visite" });
    }

    res.status(200).json({ message: "Visite trouvée", visit });
  } catch (error) {
    console.error("Erreur récupération visite:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updateVisit = async (req, res) => {
  try {
    const updates = req.body;

    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: "Visite introuvable" });

    // Vérification si le médecin ne peut modifier que ses visites
    if (req.user.role === 'medecin' && !visit.doctor.equals(req.user._id)) {
      return res.status(403).json({ message: "Accès refusé à cette visite" });
    }

    Object.assign(visit, updates);

    // Si on met à jour le paiement
    if (updates.paidAmount !== undefined && visit.payment) {
      const payment = await Payment.findById(visit.payment);
      payment.paidAmount = updates.paidAmount;
      await payment.save();

      visit.isPaid = payment.paidAmount >= payment.totalAmount;
      if (visit.isPaid && visit.status === 'en attente de consultation') {
        visit.status = 'en consultation';
      }
    }

    await visit.save();

    res.status(200).json({ message: "Visite mise à jour", visit });
  } catch (error) {
    console.error("Erreur mise à jour visite:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getMyVisitsToday = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const visits = await Visit.find({
      doctor: req.user.id,
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'terminé' }
    })
      .populate('patient')
      .populate('speciality');

    res.status(200).json(visits);
  } catch (error) {
    console.error('Erreur récupération visites du médecin:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

const finishVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visite non trouvée' });

    visit.status = 'terminé'; 
    visit.endTime = new Date();
    await visit.save();

    res.status(200).json({ message: 'Visite terminée', visit });
  } catch (error) {
    console.error('Erreur mise à jour visite:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

const getVisitsToday = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Cherche les visites du jour qui ne sont pas terminées
    const visits = await Visit.find({
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'terminé' } 
    })
      .populate('patient')
      .populate('doctor')
      .populate('speciality')
      .populate('payment');

    res.status(200).json(visits);
  } catch (error) {
    console.error('Erreur récupération visites du jour:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};

module.exports = { createVisit, getAllVisits, getVisitById, updateVisit , getVisitsToday , finishVisit , getMyVisitsToday};
