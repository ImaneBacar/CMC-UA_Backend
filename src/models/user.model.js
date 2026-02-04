const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: [String],
      enum: ['admin', 'medecin', 'secretaire', 'laborantin',"comptable"],
      required: true
    },

    phone: {
      type: String,
      trim: true
    },

    speciality: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speciality',
      required: function() {
    return Array.isArray(this.role) && this.role.includes("medecin");
  },
      validator: function(v) {
      const roles = this.role || []; 
      if (roles.includes("medecin")) {
        return Array.isArray(v) && v.length > 0;
      }
      return true;
}
    }],


    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

userSchema.pre('save', async function() {
  const user = this;

  // Si le rôle inclut médecin
  if (Array.isArray(user.role) && user.role.includes("medecin")) {
    
    // Si la spécialité est vide ou absente
    if (!user.speciality || !Array.isArray(user.speciality) || user.speciality.length === 0) {
      // On "throw" l'erreur directement
      throw new Error("Un médecin doit avoir au moins une spécialité");
    }
  }
});

module.exports = mongoose.model('User', userSchema)
