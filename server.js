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
    planId: {
      type: String,
      default: '',
      trim: true,
    },
    planName: {
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
    const { name, price, date, note, planId, planName } = req.body;
    if (!name || price === undefined || !date) {
      return res.status(400).json({ error: 'Name, price, and date are required' });
    }

    const expense = new Expense({
      name: name.trim(),
      price: Number(price),
      date,
      note: note || '',
      planId: planId || '',
      planName: planName || '',
    });

    const saved = await expense.save();

    // Auto-link to BudgetPlan if planId is provided
    if (planId) {
      try {
        const BudgetPlanModel = mongoose.models.BudgetPlan || mongoose.model('BudgetPlan');
        if (BudgetPlanModel) {
          const planQuery = mongoose.isValidObjectId(planId)
            ? { $or: [{ _id: planId }, { id: planId }] }
            : { id: planId };
          await BudgetPlanModel.findOneAndUpdate(planQuery, {
            $push: {
              expenses: {
                id: saved.id,
                name: saved.name,
                price: saved.price,
                date: saved.date,
                note: saved.note || '',
                createdAt: new Date(),
              },
            },
          });
        }
      } catch (linkErr) {
        console.warn('Could not auto-link expense to BudgetPlan:', linkErr.message);
      }
    }

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
    const { name, price, date, note, planId, planName } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (price !== undefined) updateFields.price = Number(price);
    if (date !== undefined) updateFields.date = date;
    if (note !== undefined) updateFields.note = note;
    if (planId !== undefined) updateFields.planId = planId;
    if (planName !== undefined) updateFields.planName = planName;

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

    // Also remove from any BudgetPlan if it was linked
    try {
      const BudgetPlanModel = mongoose.models.BudgetPlan || mongoose.model('BudgetPlan');
      if (BudgetPlanModel) {
        await BudgetPlanModel.updateMany(
          {},
          { $pull: { expenses: { id: id } } }
        );
      }
    } catch (unLinkErr) {
      console.warn('Could not auto-remove expense from BudgetPlan:', unLinkErr.message);
    }

    res.json({ success: true, message: 'Expense deleted successfully', id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ==========================================
// Budget Plan Schema, Model & Endpoints
// ==========================================
const budgetExpenseItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: [true, 'Expense name is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    date: { type: String, required: [true, 'Date is required'] },
    note: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const budgetPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: 100,
    },
    targetBudget: {
      type: Number,
      required: [true, 'Target budget is required'],
      min: [0, 'Target budget cannot be negative'],
    },
    monthKey: {
      type: String,
      required: [true, 'Month is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    expenses: {
      type: [budgetExpenseItemSchema],
      default: [],
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

const BudgetPlan = mongoose.model('BudgetPlan', budgetPlanSchema);

// GET all budget plans (optional query ?month=YYYY-MM)
app.get('/api/budgets', async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { monthKey: month } : {};
    const plans = await BudgetPlan.find(filter).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching budget plans:', error);
    res.status(500).json({ error: 'Failed to fetch budget plans' });
  }
});

// POST create a new budget plan
app.post('/api/budgets', async (req, res) => {
  try {
    const { name, targetBudget, monthKey, category, color, expenses } = req.body;
    if (!name || targetBudget === undefined || !monthKey) {
      return res.status(400).json({ error: 'Name, targetBudget, and monthKey are required' });
    }

    const plan = new BudgetPlan({
      name: name.trim(),
      targetBudget: Number(targetBudget),
      monthKey: monthKey.trim(),
      category: category ? category.trim() : 'General',
      color: color || '#4f46e5',
      expenses: Array.isArray(expenses) ? expenses : [],
    });

    const saved = await plan.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating budget plan:', error);
    res.status(400).json({ error: error.message || 'Failed to create budget plan' });
  }
});

// PUT update a budget plan
app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetBudget, monthKey, category, color } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (targetBudget !== undefined) updateFields.targetBudget = Number(targetBudget);
    if (monthKey !== undefined) updateFields.monthKey = monthKey.trim();
    if (category !== undefined) updateFields.category = category.trim();
    if (color !== undefined) updateFields.color = color;

    const updated = await BudgetPlan.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating budget plan:', error);
    res.status(400).json({ error: error.message || 'Failed to update budget plan' });
  }
});

// DELETE a budget plan
app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BudgetPlan.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }
    res.json({ success: true, message: 'Budget plan deleted successfully', id });
  } catch (error) {
    console.error('Error deleting budget plan:', error);
    res.status(500).json({ error: 'Failed to delete budget plan' });
  }
});

// POST add an expense item directly to a budget plan
app.post('/api/budgets/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, date, note, id: expenseId } = req.body;

    if (!name || price === undefined || !date) {
      return res.status(400).json({ error: 'Name, price, and date are required' });
    }

    const plan = await BudgetPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    const newExpense = {
      id: expenseId || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      price: Number(price),
      date,
      note: note ? note.trim() : '',
      createdAt: new Date(),
    };

    plan.expenses.unshift(newExpense);
    await plan.save();

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error adding expense to budget plan:', error);
    res.status(400).json({ error: error.message || 'Failed to add expense to budget plan' });
  }
});

// DELETE remove an expense item from a budget plan
app.delete('/api/budgets/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const plan = await BudgetPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    plan.expenses = plan.expenses.filter(e => e.id !== expenseId);
    await plan.save();

    res.json(plan);
  } catch (error) {
    console.error('Error deleting expense from budget plan:', error);
    res.status(500).json({ error: 'Failed to delete expense from budget plan' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

