const Speciality = require("../models/speciality.model");

const createSpeciality = async (req,res) => {
try {
    const {name,description}=req.body;
    if (!name) {
        return res.status(400).json({message:"Le nom de la specialité est requis"})
    }
    const existingSpeciality = await Speciality.findOne({name:name.toLowerCase()});

    if (existingSpeciality) {
        return res.status(400).json({message:"Cette spécialité existe déja"})
    }
    const newSpeciality =await Speciality.create({
        name:name.toLowerCase(),
        description: description || "",
        createdBy:req.body.createdBy
    })

    res.status(201).json({
        message:"Spécialité créée avec succès",
        data: newSpeciality
    })
} catch (error) {
    console.error('Erreur création spécialité:', error)
    res.status(500).json({ 
        message: 'Erreur serveur lors de la création' 
    })
    }
}

const getAllSpecialities = async (req,res)=>{
    try {
        const specialities = await Speciality.find().sort({name:1}).populate("createdBy","fullname email");
        res.status(200).json({
            message:"liste des specialités recuperé",
            count:specialities.length,
            data:specialities
        })
    } catch (error) {
        console.error("Erreur lecture spécialités:", error);
        res.status(500).json({
        message: "Erreur serveur lors de la lecture",
    });
    }
}

const updateSpeciality = async (req,res)=>{

    try {
        const {id}=req.params;
        const {name,description,isActive}=req.body;

        const speciality = await Speciality.find(id);
        if (!speciality) {
            return res.status(404).json({
                message:"Spécialité non trouvée"
            })
        }
        //Si on change le nom, vérifier qu'il n'existe pas déjà
        if (name && name.toLowerCase() !== speciality.name ) {
            const existingName = await Speciality.findOne({
                name:name.toLowerCase(),
                _id:{$ne:id}// Exclure la spécialité actuelle
            })

            if (existingName) {
                return res.status({
                    message:"Ce nom est déja utilisé"
                })
            }
        }

        if(name) speciality.name = name.toLowerCase()
        if (description !== undefined) speciality.description = description;
        if (isActive !== undefined) speciality.isActive = isActive;

        await speciality.save();

        res.status(200).json({
        message: "Spécialité mise à jour",
        data: speciality,
    });
    } catch (error) {
        console.error("Erreur modification spécialité:", error);
        res.status(500).json({
        message: "Erreur serveur",
    });
    }
}

const toggleSpecialityStatus = async (req, res) => {
  try {
    const speciality = await Speciality.findById(req.params.id)
    if (!speciality) return res.status(404).json({ message: "Spécialité non trouvée" })

    // On inverse l'état
    speciality.isActive = !speciality.isActive
    await speciality.save()

    res.status(200).json({ 
      message: `Spécialité ${speciality.name} ${speciality.isActive ? 'activée' : 'désactivée'}`, 
      speciality 
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}


module.exports={
    createSpeciality,
    getAllSpecialities,
    toggleSpecialityStatus,
    updateSpeciality
}