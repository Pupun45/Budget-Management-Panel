import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB Atlas: BudgePlan`);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
  });

// Expense Schema & Model
const expenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Expense name is required'],
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Expense = mongoose.model('Expense', expenseSchema);

// Routes
// Health check
app.get('/api/health', (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isConnected ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'BudgePlan',
    timestamp: new Date().toISOString(),
  });
});

// GET all expenses
app.get('/api/expenses', async (_req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { name, price, date, note } = req.body;
    if (!name || price === undefined || !date) {
      return res.status(400).json({ error: 'Name, price, and date are required' });
    }

    const expense = new Expense({
      name: name.trim(),
      price: Number(price),
      date,
      note: note || '',
    });

    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ error: error.message || 'Failed to create expense' });
  }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, date, note } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (price !== undefined) updateFields.price = Number(price);
    if (date !== undefined) updateFields.date = date;
    if (note !== undefined) updateFields.note = note;

    const updated = await Expense.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(400).json({ error: error.message || 'Failed to update expense' });
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true, message: 'Expense deleted successfully', id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
