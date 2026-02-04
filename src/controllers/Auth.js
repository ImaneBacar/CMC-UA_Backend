const User = require("../models/user.model")
const bcrypt =  require("bcrypt")
const jwt =  require("jsonwebtoken")


/// Register User 
const registerUser = async (req,res) => {
    try {
        const {fullname,email,password,role,phone,speciality} = req.body;
        // check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: "User already exists"})
        }
        
        const passwordHash = await bcrypt.hash(password,10);

        const newUser = await User.create({
            fullname,email,password:passwordHash,role,phone,speciality
        })

        return res.status(201).json({message: "User registered successfully"})

    } catch (error) {

        if (error.message.includes("spécialité")) {
        return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: "Erreur interne du serveur" });
        
    }
}

const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body;

        const user = await User.findOne({email});

        if (!user || !user.isActive) {
            return res.status(400).json({ message: "Utilisateur non trouvé ou désactivé" });
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalide email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.status(200).json({ 
            message: "Connexion réussie", 
            token, 
            user: { 
                id: user._id, 
                fullname: user.fullname, 
                role: user.role 
            } 
        });

    } catch (error) {
        console.log("Error logging in user: ", error);
        return res.status(500).json({message: error.message});
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        // Vérifier le mot de passe actuel
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mot de passe actuel incorrect" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



module.exports={registerUser,loginUser,changePassword}