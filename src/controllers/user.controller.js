const User = require("../models/user.model");

const createUser = async(req,res) => {
 if (!req.body.fullname) {
      return res.status(400).json({ message: 'Le nom de la specialité est requis' })
    }

    const user = new User({
        fullname:req.body.fullname,
        email:req.body.email,
        password:req.body.password,
        role:req.body.role,
        phone:req.body.phone,
        speciality:req.body.speciality 
    })
    try {
        const newUser = await user.save()
        res.status(201).json(newUser)
    } catch (error) {
        res.status(400).json({message:error.message})
    }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('speciality', 'name')
      .select("-password");

    if (users.length === 0) {
      return res.status(404).json({
        message: "Pas d'utilisateur disponible",
      });
    }
    res.status(200).json({
      message: "Tous les utilisateurs",
      data: users
    });

  } catch (error) {
    console.error("Erreur récupération users:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des utilisateurs"
    });
  }
};

const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ message: `Compte ${user.isActive ? 'activé' : 'désactivé'}` });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('speciality', 'name');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

const updateMyProfile = async (req, res) => {
  try {
    const { fullname, email, phone } = req.body;

    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée à mettre à jour"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    return res.status(200).json({
      message: "Profil mis à jour avec succès",
      user: updatedUser
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé"
      });
    }

    console.error("Erreur update profile:", error);
    return res.status(500).json({
      message: "Erreur lors de la mise à jour"
    });
  }
};

module.exports = { getAllUsers,createUser,getMyProfile,toggleUserStatus,updateMyProfile };
