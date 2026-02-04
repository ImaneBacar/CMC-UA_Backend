const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authorize = (roles = []) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

            if (!token) return res.status(401).json({ message: "Accès refusé" });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user || !user.isActive) {
                return res.status(401).json({ message: "Utilisateur non trouvé ou désactivé" });
            }

            // Vérification des rôles 
            if (roles.length && !roles.some(r => user.role.includes(r))) {
                return res.status(403).json({ message: "Accès interdit : Permissions insuffisantes" });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: "Session expirée ou invalide" });
        }
    };
};

module.exports = authorize;