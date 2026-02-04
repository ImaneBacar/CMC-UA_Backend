const Payment = require('../models/payment.model');

// Récupérer tous les paiements ou filtrés
const getAllPayments = async (req, res) => {
  try {
    const { patient, startDate, endDate, status } = req.query;
    let filter = {};

    if (patient) filter.patient = patient;
    if (status) filter.status = status;
    if (startDate || endDate) filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);

    const payments = await Payment.find(filter)
      .populate('patient', 'fullname')
      .populate('visit', 'visitNumber visitDate')
      .populate('validatedBy', 'fullname');

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Erreur récupération paiements:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Ajouter un versement ou remboursement
const updatePayment = async (req, res) => {
  try {
    const { paidAmount, repayment } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable' });

    if (paidAmount !== undefined) payment.paidAmount = paidAmount;

    if (repayment) {
      payment.repayments.push({
        ...repayment,
        validatedBy: req.user._id
      });
    }

    await payment.save();
    res.status(200).json({ message: 'Paiement mis à jour', payment });
  } catch (error) {
    console.error('Erreur mise à jour paiement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { getAllPayments, updatePayment };
