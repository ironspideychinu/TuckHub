import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String }, // not required for Microsoft OAuth users
    role: { type: String, enum: ['student', 'staff', 'runner', 'admin'], default: 'student' },
    microsoftId: { type: String, index: true },
    authProvider: { type: String, enum: ['local', 'microsoft'], default: 'local' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('User', userSchema);
