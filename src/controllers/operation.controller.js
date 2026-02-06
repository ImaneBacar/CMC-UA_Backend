const Operation = require('../models/operation.model')
const Payment = require('../models/payment.model')
const Patient = require('../models/patient.model')
const MedicalRecord = require('../models/medicalRecord.model')
const { generateNumeroOperation, generateNumeroPaiement } = require('../utils/generateNumero')

const scheduleOperation = async (req, res) => {
  try {
    const {
      patient,
      visit,
      title,
      type,
      description,
      surgeon,
      scheduledDate,
      scheduledStartTime,
      scheduledDuration,
      cost,
      anesthesiaType
    } = req.body
    
    // Vérifier que le patient existe
    const patientExists = await Patient.findById(patient)
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient non trouvé' })
    }
    
    // Générer le numéro d'opération
    const operationNumber = await generateNumeroOperation()
    
    // Créer l'opération
    const operation = await Operation.create({
      operationNumber,
      patient,
      visit,
      title,
      type: type || 'mineure',
      description,
      surgeon,
      scheduledDate,
      scheduledStartTime,
      scheduledDuration,
      cost,
      anesthesiaType,
      status: 'en_attente_de_paiement',
      createdBy: req.user.id
    })
    
    // Créer automatiquement un paiement en dette
    const payment = await Payment.create({
      paymentNumber: await generateNumeroPaiement(),
      visit,
      patient,
      details: [{
        type: 'operation',
        description: `Opération: ${title}`,
        reference: operation._id,
        referenceModel: 'Operation',
        amount: cost
      }],
      totalAmount: cost,
      paidAmount: 0,
      remainingAmount: cost,
      hasDebt: true,
      debtStatus: 'active',
      status: 'impaye',
      createdBy: req.user.id
    })
    
    // Lier le paiement à l'opération
    operation.payment = payment._id
    await operation.save()
    
    let medicalRecord = await MedicalRecord.findOne({ patient })
    
    if (!medicalRecord) {
      // Créer le dossier médical s'il n'existe pas
      medicalRecord = await MedicalRecord.create({
        patient,
        operations: [operation._id]
      })
    } else {
      // Ajouter l'opération au dossier existant
      medicalRecord.operations.push(operation._id)
      medicalRecord.updatedBy = req.user.id
      await medicalRecord.save()
    }
    
    //  Populate pour la réponse
    await operation.populate('patient surgeon visit payment')
    
    res.status(201).json({
      message: 'Opération programmée et ajoutée au dossier médical',
      data: operation
    })
    
  } catch (error) {
    console.error('Erreur création opération:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params
    const { paidAmount, paymentMethod } = req.body
    
    // Récupérer le paiement
    const payment = await Payment.findById(id)
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' })
    }
    
    // Mettre à jour le montant payé
    payment.paidAmount = paidAmount
    payment.paymentMethod = paymentMethod
    payment.paymentDate = new Date()
    payment.validatedBy = req.user.id
    

    await payment.save()
    
    
    if (payment.status === 'paye') {
      // Chercher l'opération liée à ce paiement
      const operation = await Operation.findOne({ payment: payment._id })
      
      if (operation) {
        operation.status = 'programmee'  
        operation.isPaid = true
        await operation.save()
      }
    }
    
    res.status(200).json({
      message: 'Paiement mis à jour',
      data: payment
    })
    
  } catch (error) {
    console.error('Erreur mise à jour paiement:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const startOperation = async (req, res) => {
  try {
    const { id } = req.params
    
    const operation = await Operation.findById(id)
    
    if (!operation) {
      return res.status(404).json({ message: 'Opération non trouvée' })
    }
    
    // Vérifier que l'opération est payée
    if (operation.status !== 'programmee') {
      return res.status(400).json({ 
        message: 'Opération doit être programmée (et payée) avant de démarrer' 
      })
    }
    
    // Vérifier que c'est bien le chirurgien qui démarre
    if (req.user.id !== operation.surgeon.toString()) {
      return res.status(403).json({ 
        message: 'Seul le chirurgien peut démarrer l\'opération' 
      })
    }
    
    // Démarrer l'opération
    operation.status = 'en_cours'
    operation.actualDate = new Date()
    operation.startTime = new Date().toTimeString().slice(0, 5)
    
    await operation.save()
    
    res.status(200).json({
      message: 'Opération démarrée',
      data: operation
    })
    
  } catch (error) {
    console.error('Erreur démarrage opération:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const completeOperation = async (req, res) => {
  try {
    const { id } = req.params
    const {
      operativeReport,
      postOperativeReport,
      complications,
      recommendations
    } = req.body
    
    const operation = await Operation.findById(id)
    
    if (!operation) {
      return res.status(404).json({ message: 'Opération non trouvée' })
    }
    
    if (operation.status !== 'en_cours') {
      return res.status(400).json({ 
        message: 'Opération doit être en cours' 
      })
    }
    
    // Terminer l'opération
    operation.status = 'terminee'
    operation.endTime = new Date().toTimeString().slice(0, 5)
    operation.operativeReport = operativeReport
    operation.postOperativeReport = postOperativeReport
    operation.complications = complications
    operation.recommendations = recommendations
    
    await operation.save()
    
    res.status(200).json({
      message: 'Opération terminée',
      data: operation
    })
    
  } catch (error) {
    console.error('Erreur fin opération:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const cancelOperation = async (req, res) => {
  try {
    const { id } = req.params
    const { cancelledReason } = req.body
    
    const operation = await Operation.findById(id).populate('payment')
    
    if (!operation) {
      return res.status(404).json({ message: 'Opération non trouvée' })
    }
    
    // Vérifier le rôle
    if (req.user.role.includes('medecin')) {
      return res.status(403).json({ 
        message: 'Seule la secrétaire peut annuler' 
      })
    }
    
    // Annuler l'opération
    operation.status = 'annulee'
    operation.cancelledBy = req.user.id
    operation.cancelledReason = cancelledReason
    await operation.save()
    
    // Gérer le remboursement
    if (operation.payment && operation.isPaid) {
      const payment = await Payment.findById(operation.payment)
      
      if (payment && payment.paidAmount > 0) {
        payment.isRefunded = true
        payment.refundAmount = payment.paidAmount
        payment.refundDate = new Date()
        payment.refundReason = `Annulation opération: ${cancelledReason}`
        payment.refundedBy = req.user.id
        payment.excludeFromStats = true
        await payment.save()
        
        operation.isPaid = false
        await operation.save()
      }
    }
  
    res.status(200).json({
      message: 'Opération annulée avec remboursement',
      data: operation
    })
    
  } catch (error) {
    console.error('Erreur annulation:', error)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}


// Route pour médecin
const getMyOperations = async (req, res) => {
  try {
    const operations = await Operation.find({
      surgeon: req.user.id  
    })
      .populate('patient', 'fullname patientNumber')
      .populate('visit', 'visitNumber')
      .sort({ scheduledDate: -1 })
    
    res.status(200).json({ data: operations })
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const getAllOperations = async (req, res) => {
  try {
    const { status, surgeon, patient } = req.query
    
    const filter = {}
    
    if (status) filter.status = status
    if (surgeon) filter.surgeon = surgeon
    if (patient) filter.patient = patient
    
    const operations = await Operation.find(filter)
      .populate('patient', 'fullname patientNumber phone')
      .populate('surgeon', 'fullname')
      .populate('payment')
      .sort({ scheduledDate: 1 }) 
    
    res.status(200).json({
      count: operations.length,
      data: operations
    })
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const getDoctorDashboard = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Opérations d'aujourd'hui
    const todayOperations = await Operation.find({
      surgeon: req.user.id,
      scheduledDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('patient')
    
    // Opérations à venir
    const upcomingOperations = await Operation.find({
      surgeon: req.user.id,
      status: 'programmee',
      scheduledDate: { $gt: today }
    })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .populate('patient')
    
    // Opérations en cours
    const ongoingOperations = await Operation.find({
      surgeon: req.user.id,
      status: 'en_cours'
    }).populate('patient')
    
    res.status(200).json({
      today: todayOperations,
      upcoming: upcomingOperations,
      ongoing: ongoingOperations
    })
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const getPaymentDashboard = async (req, res) => {
  try {
    // Opérations en attente de paiement
    const unpaidOperations = await Operation.find({
      status: 'en_attente_de_paiement'
    })
      .populate('patient', 'fullname phone')
      .populate('payment')
      .sort({ scheduledDate: 1 })
    
    // Opérations programmées 
    const scheduledOperations = await Operation.find({
      status: 'programmee'
    })
      .populate('patient surgeon')
      .sort({ scheduledDate: 1 })
    
    res.status(200).json({
      unpaid: unpaidOperations,
      scheduled: scheduledOperations
    })
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}


const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params
    
    const medicalRecord = await MedicalRecord.findOne({ 
      patient: patientId 
    })
      .populate({
        path: 'operations',
        populate: [
          { path: 'surgeon', select: 'fullname' },
          { path: 'payment' }
        ]
      })
      .populate('visits')
      .populate('prescriptions')
      .populate('analyses')
    
    if (!medicalRecord) {
      return res.status(404).json({ 
        message: 'Dossier médical non trouvé' 
      })
    }
    
    // Séparer les opérations par statut
    const operationsCompleted = medicalRecord.operations.filter(
      op => op.status === 'terminee'
    )
    
    const operationsScheduled = medicalRecord.operations.filter(
      op => op.status === 'programmee'
    )
    
    const operationsCancelled = medicalRecord.operations.filter(
      op => op.status === 'annulee'
    )
    
    res.status(200).json({
      medicalRecord,
      operationsSummary: {
        completed: operationsCompleted,
        scheduled: operationsScheduled,
        cancelled: operationsCancelled
      }
    })
    
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
module.exports = {
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
}
