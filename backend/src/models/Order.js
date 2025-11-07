import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending_payment', 'placed', 'making', 'ready', 'completed'], required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending_payment', 'placed', 'making', 'ready', 'completed'], default: 'pending_payment' },
  status_history: { type: [statusHistorySchema], default: [{ status: 'pending_payment', timestamp: new Date() }] },
    assignedRunnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentIntentId: { type: String, unique: true, sparse: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('Order', orderSchema);
