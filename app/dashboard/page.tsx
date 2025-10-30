"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Expense, Category, Budget, SavingsGoal } from "@/types";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiTrendingUp,
  FiPieChart,
  FiList,
  FiSettings,
  FiLogOut,
  FiEdit2,
  FiTrash2,
  FiX,
  FiTarget,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import DarkModeToggle from "@/components/DarkModeToggle";
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getBudget,
  saveBudget,
  initializeDefaultCategories,
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from "@/lib/firestore";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#6b7280",
];

// Helper function to convert Tailwind color classes to hex
const getColorHex = (colorClass: string): string => {
  const colorMap: { [key: string]: string } = {
    "bg-blue-500": "#3b82f6",
    "bg-green-500": "#10b981",
    "bg-purple-500": "#8b5cf6",
    "bg-yellow-500": "#f59e0b",
    "bg-pink-500": "#ec4899",
    "bg-red-500": "#ef4444",
    "bg-indigo-500": "#6366f1",
    "bg-teal-500": "#14b8a6",
    "bg-orange-500": "#f97316",
    "bg-gray-500": "#6b7280",
  };
  return colorMap[colorClass] || "#3b82f6";
};

export default function Dashboard() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "analytics" | "settings" | "savings"
  >("overview");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'amount';
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "bg-blue-500",
  });
  const [monthlyBudgetAmount, setMonthlyBudgetAmount] = useState(1000);
  const [categoryBudgets, setCategoryBudgets] = useState<{
    [key: string]: number;
  }>({});
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<SavingsGoal | null>(null);
  const [newSavingsGoal, setNewSavingsGoal] = useState({
    goalName: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
  });

  const colorOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return sortConfig.direction === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    } else {
      return sortConfig.direction === 'asc' 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    }
  });

  // Calculate summary
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = budget?.monthlyBudget || 1000;
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetPercentage = (totalSpent / monthlyBudget) * 100;

  // Calculate spending velocity
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const daysInMonth = endOfMonth(now).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;
  
  // Calculate current month expenses only
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
    return expenseDate >= currentMonth && expenseDate <= now;
  });
  const currentMonthSpent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Spending velocity metrics
  const dailyAverageSpent = daysPassed > 0 ? currentMonthSpent / daysPassed : 0;
  const dailyBudgetAllowance = monthlyBudget / daysInMonth;
  const projectedMonthEnd = dailyAverageSpent * daysInMonth;
  const dailyBudgetRemaining = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
  const isOnTrack = dailyAverageSpent <= dailyBudgetAllowance;

  // Handle sort
  const requestSort = (key: 'date' | 'amount') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Sort indicator
  const SortIndicator = ({ column }: { column: 'date' | 'amount' }) => {
    if (sortConfig.key !== column) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        await initializeDefaultCategories(user.uid);

        const [expensesData, categoriesData, budgetData, savingsGoalsData] = await Promise.all([
          getExpenses(user.uid),
          getCategories(user.uid),
          getBudget(user.uid),
          getSavingsGoals(user.uid),
        ]);

        setExpenses(expensesData);
        setCategories(categoriesData);
        setBudget(budgetData);
        setSavingsGoals(savingsGoalsData);
        if (budgetData) {
          setMonthlyBudgetAmount(budgetData.monthlyBudget);
          setCategoryBudgets(budgetData.categories || {});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      await deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleAddCategory = async () => {
    if (!user || !newCategory.name.trim()) return;

    try {
      const id = await addCategory({
        name: newCategory.name,
        color: newCategory.color,
        userId: user.uid,
      });

      const category = { id, ...newCategory, userId: user.uid };
      setCategories([...categories, category]);
      setNewCategory({ name: "", color: "bg-blue-500" });
      setShowCategoryModal(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name.trim()) return;

    try {
      await updateCategory(editingCategory.id, {
        name: newCategory.name,
        color: newCategory.color,
      });

      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: newCategory.name, color: newCategory.color }
            : c
        )
      );
      setEditingCategory(null);
      setNewCategory({ name: "", color: "bg-blue-500" });
      setShowCategoryModal(false);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleSaveBudget = async () => {
    if (!user) return;

    try {
      await saveBudget(user.uid, {
        monthlyBudget: monthlyBudgetAmount,
        categories: categoryBudgets,
      });

      setBudget({
        userId: user.uid,
        monthlyBudget: monthlyBudgetAmount,
        categories: categoryBudgets,
      });
      setShowBudgetModal(false);
      toast.success("Budget saved successfully");
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    }
  };

  const handleAddSavingsGoal = async () => {
    if (!user || !newSavingsGoal.goalName.trim() || newSavingsGoal.targetAmount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const goalData: any = {
        userId: user.uid,
        goalName: newSavingsGoal.goalName,
        targetAmount: newSavingsGoal.targetAmount,
        currentAmount: newSavingsGoal.currentAmount,
      };

      // Only add deadline if it's not empty
      if (newSavingsGoal.deadline && newSavingsGoal.deadline.trim() !== '') {
        goalData.deadline = newSavingsGoal.deadline;
      }

      console.log('Goal data being sent (should NOT have deadline if empty):', goalData);
      console.log('Has deadline property?', 'deadline' in goalData);

      const id = await addSavingsGoal(goalData);

      const goal: SavingsGoal = {
        id,
        userId: user.uid,
        ...newSavingsGoal,
      };
      setSavingsGoals([...savingsGoals, goal]);
      setNewSavingsGoal({ goalName: "", targetAmount: 0, currentAmount: 0, deadline: "" });
      setShowSavingsModal(false);
      toast.success("Savings goal added successfully");
    } catch (error: any) {
      console.error("Error adding savings goal:", error);
      console.error("Error message:", error?.message);
      console.error("Error code:", error?.code);
      toast.error(`Failed to add savings goal: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleUpdateSavingsGoal = async () => {
    if (!editingSavingsGoal || !newSavingsGoal.goalName.trim() || newSavingsGoal.targetAmount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updateData: any = {
        goalName: newSavingsGoal.goalName,
        targetAmount: newSavingsGoal.targetAmount,
        currentAmount: newSavingsGoal.currentAmount,
      };

      // Only add deadline if it's not empty
      if (newSavingsGoal.deadline && newSavingsGoal.deadline.trim() !== '') {
        updateData.deadline = newSavingsGoal.deadline;
      }

      await updateSavingsGoal(editingSavingsGoal.id!, updateData);

      setSavingsGoals(
        savingsGoals.map((g) =>
          g.id === editingSavingsGoal.id
            ? { ...g, ...newSavingsGoal }
            : g
        )
      );
      setEditingSavingsGoal(null);
      setNewSavingsGoal({ goalName: "", targetAmount: 0, currentAmount: 0, deadline: "" });
      setShowSavingsModal(false);
      toast.success("Savings goal updated successfully");
    } catch (error) {
      console.error("Error updating savings goal:", error);
      toast.error("Failed to update savings goal");
    }
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this savings goal?"))
      return;

    try {
      await deleteSavingsGoal(id);
      setSavingsGoals(savingsGoals.filter((g) => g.id !== id));
      toast.success("Savings goal deleted successfully");
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      toast.error("Failed to delete savings goal");
    }
  };

  // Analytics data
  const categoryBreakdown = categories
    .map((category) => {
      const total = expenses
        .filter((e) => e.category === category.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: category.name, value: total, color: category.color };
    })
    .filter((c) => c.value > 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthTotal = expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month: format(date, "MMM"),
      amount: monthTotal,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg dark:shadow-teal-500/5 z-10 dark:border-r dark:border-slate-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-teal-400">Quantro</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Welcome, {user?.email?.split("@")[0] || "User"}
          </p>
        </div>

        <nav className="mt-8">
          <NavItem
            icon={<TbCurrencyRupee />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            icon={<FiList />}
            label="Transactions"
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
          />
          <NavItem
            icon={<FiTrendingUp />}
            label="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
          <NavItem
            icon={<FiTarget />}
            label="Savings Goals"
            active={activeTab === "savings"}
            onClick={() => setActiveTab("savings")}
          />
          <NavItem
            icon={<FiSettings />}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />

          <div className="absolute bottom-0 w-full p-4">
            <button
              onClick={() => {
                logOut();
                router.push("/login");
              }}
              className="flex items-center w-full p-3 text-left text-red-500 dark:text-rose-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-500/10 dark:hover:border dark:hover:border-rose-500/30 transition-colors"
            >
              <FiLogOut className="mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {activeTab === "overview" && "Dashboard"}
            {activeTab === "transactions" && "Transactions"}
            {activeTab === "analytics" && "Analytics"}
            {activeTab === "savings" && "Savings Goals"}
            {activeTab === "settings" && "Settings"}
          </h2>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <button
              onClick={() => router.push("/add-expense")}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-teal-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-teal-400 transition-colors shadow-sm"
            >
              <FiPlus className="mr-2" />
              Add Expense
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Budget Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow-lg flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly Budget</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{monthlyBudget.toFixed(2)}
                  </h3>
                </div>
                <div className={`p-2 rounded-lg ${
                  isOnTrack 
                    ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  <TbCurrencyRupee size={24} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">₹{currentMonthSpent.toFixed(0)} spent</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{budgetPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      budgetPercentage > 100 
                        ? "bg-red-500" 
                        : budgetPercentage > 80 
                        ? "bg-amber-500" 
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Avg</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{dailyAverageSpent.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Should Spend</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{dailyBudgetAllowance.toFixed(0)}</p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`relative overflow-hidden rounded-xl ${
                isOnTrack 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-base">
                        {isOnTrack ? 'On Track!' : 'Over Budget!'}
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        {daysRemaining} days left • ₹{dailyBudgetRemaining.toFixed(0)}/day available
                      </p>
                    </div>
                    
                    {!isOnTrack && (
                      <div className="text-right bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                        <p className="text-xs text-white/80">Projected</p>
                        <p className="text-lg font-bold">
                          ₹{projectedMonthEnd.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Budgets */}
              {Object.keys(categoryBudgets).filter(catId => categoryBudgets[catId] > 0).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category Budgets</h4>
                  <div className="space-y-3">
                    {categories
                      .filter(cat => categoryBudgets[cat.id] && categoryBudgets[cat.id] > 0)
                      .map((category) => {
                        const categorySpent = expenses
                          .filter(exp => exp.category === category.id && 
                            new Date(exp.date) >= startOfMonth(new Date()) &&
                            new Date(exp.date) <= endOfMonth(new Date()))
                          .reduce((sum, exp) => sum + exp.amount, 0);
                        const categoryBudget = categoryBudgets[category.id];
                        const categoryPercentage = (categorySpent / categoryBudget) * 100;

                        return (
                          <div key={category.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{category.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                  ₹{categorySpent.toFixed(0)} / ₹{categoryBudget.toFixed(0)}
                                </span>
                                <span className={`font-semibold ${
                                  categoryPercentage > 100 ? 'text-red-600 dark:text-red-400' :
                                  categoryPercentage > 80 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {categoryPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  categoryPercentage > 100 ? "bg-red-500" :
                                  categoryPercentage > 80 ? "bg-amber-500" :
                                  "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(categoryPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No expenses yet. Add your first expense!
                  </p>
                ) : (
                  expenses.slice(0, 5).map((expense) => {
                    const category = categories.find(
                      (c) => c.id === expense.category
                    );
                    return (
                      <div
                        key={expense.id}
                        className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg ${
                              category?.color || "bg-gray-500"
                            } bg-opacity-20`}
                          >
                            <span className="text-sm font-semibold">
                              {category?.name?.[0] || "O"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {expense.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(expense.date), "MMM d, yyyy")} •{" "}
                              {category?.name || "Other"}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-red-600">
                          -₹{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Categories Breakdown */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow lg:col-span-3">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Spending by Category
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="p-4 border dark:border-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${category.color} mr-2`}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{category.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {totalSpent > 0
                        ? ((category.value / totalSpent) * 100).toFixed(0)
                        : 0}
                      % of total
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Transactions</h3>
            </div>
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No transactions yet.</p>
                <button
                  onClick={() => router.push("/add-expense")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Your First Expense
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        <SortIndicator column="date" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => requestSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        <SortIndicator column="amount" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedExpenses.map((expense) => {
                    const category = categories.find((c) => c.id === expense.category);
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 align-middle">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.date instanceof Date 
                              ? expense.date.toLocaleDateString() 
                              : new Date(expense.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ₹{expense.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center">
                            <div
                              className={`h-3 w-3 rounded-full mr-2 flex-shrink-0 ${category?.color || 'bg-gray-500'}`}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {category?.name || 'Uncategorized'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right align-middle">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/edit-expense/${expense.id || ''}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => expense.id && handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Spending Trend */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-6">
                Spending Trend (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    name="Spending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-6">
                  Category Distribution
                </h3>
                {categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                    No expense data to display
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-6">
                  Category Spending
                </h3>
                {categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                    No expense data to display
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "savings" && (
          <div className="space-y-6">
            {/* Add Savings Goal Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingSavingsGoal(null);
                  setNewSavingsGoal({ goalName: "", targetAmount: 0, currentAmount: 0, deadline: "" });
                  setShowSavingsModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 dark:bg-teal-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-teal-400 transition-colors shadow-sm"
              >
                <FiPlus className="mr-2" />
                Add Savings Goal
              </button>
            </div>

            {/* Savings Goals Grid */}
            {savingsGoals.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-12 rounded-xl shadow text-center">
                <FiTarget className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No savings goals yet. Start by creating your first goal!
                </p>
                <button
                  onClick={() => {
                    setEditingSavingsGoal(null);
                    setNewSavingsGoal({ goalName: "", targetAmount: 0, currentAmount: 0, deadline: "" });
                    setShowSavingsModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savingsGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isCompleted = progress >= 100;
                  const daysLeft = goal.deadline 
                    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={goal.id}
                      className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {goal.goalName}
                          </h3>
                          {goal.deadline && (
                            <p className={`text-sm ${
                              daysLeft && daysLeft < 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : daysLeft && daysLeft < 30 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {daysLeft && daysLeft < 0 
                                ? `Overdue by ${Math.abs(daysLeft)} days`
                                : daysLeft 
                                ? `${daysLeft} days left`
                                : 'No deadline'}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSavingsGoal(goal);
                              setNewSavingsGoal({
                                goalName: goal.goalName,
                                targetAmount: goal.targetAmount,
                                currentAmount: goal.currentAmount,
                                deadline: goal.deadline 
                                  ? (goal.deadline instanceof Date 
                                    ? goal.deadline.toISOString().split('T')[0] 
                                    : new Date(goal.deadline).toISOString().split('T')[0])
                                  : "",
                              });
                              setShowSavingsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => goal.id && handleDeleteSavingsGoal(goal.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Circle or Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            ₹{goal.currentAmount.toLocaleString('en-IN')} saved
                          </span>
                          <span className={`font-semibold ${
                            isCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {Math.min(progress, 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              isCompleted 
                                ? "bg-green-500" 
                                : progress > 75 
                                ? "bg-blue-500" 
                                : progress > 50 
                                ? "bg-teal-500" 
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Target Amount */}
                      <div className="pt-4 border-t dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ₹{goal.targetAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
                          <span className={`text-sm font-semibold ${
                            isCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {isCompleted 
                              ? 'Goal Achieved! 🎉' 
                              : `₹${(goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary Card */}
            {savingsGoals.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 dark:from-teal-600 dark:to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-xl font-bold mb-4">Savings Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/80 mb-1">Total Goals</p>
                    <p className="text-2xl font-bold">{savingsGoals.length}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/80 mb-1">Total Saved</p>
                    <p className="text-2xl font-bold">
                      ₹{savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-sm text-white/80 mb-1">Target Amount</p>
                    <p className="text-2xl font-bold">
                      ₹{savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-6">
                Account Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Budget Management */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Budget Management
                </h3>
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Budget
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Monthly Budget:{" "}
                  <span className="font-semibold">
                    ₹{monthlyBudget.toFixed(2)}
                  </span>
                </p>
                {Object.keys(categoryBudgets).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Budgets:
                    </p>
                    {categories.map(
                      (cat) =>
                        categoryBudgets[cat.id] && (
                          <div
                            key={cat.id}
                            className="flex justify-between text-sm py-1"
                          >
                            <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                            <span className="font-semibold">
                              ₹{categoryBudgets[cat.id].toFixed(2)}
                            </span>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category Management */}
            <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-6 rounded-xl shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Manage Categories
                </h3>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategory({ name: "", color: "bg-blue-500" });
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Category
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded-full ${category.color} mr-2`}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setNewCategory({
                            name: category.name,
                            color: category.color,
                          });
                          setShowCategoryModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Groceries"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-10 h-10 rounded-lg ${color} ${
                        newCategory.color === color
                          ? "ring-2 ring-offset-2 ring-blue-500"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    editingCategory ? handleUpdateCategory : handleAddCategory
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goal Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingSavingsGoal ? "Edit Savings Goal" : "Add Savings Goal"}
              </h3>
              <button onClick={() => setShowSavingsModal(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={newSavingsGoal.goalName}
                  onChange={(e) =>
                    setNewSavingsGoal({ ...newSavingsGoal, goalName: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                  placeholder="e.g., New Laptop, Vacation, Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">₹</span>
                  <input
                    type="number"
                    value={newSavingsGoal.targetAmount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewSavingsGoal({ 
                        ...newSavingsGoal, 
                        targetAmount: value === '' ? 0 : parseFloat(value) 
                      });
                    }}
                    className="w-full pl-8 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                    min="0"
                    step="100"
                    placeholder="10000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">₹</span>
                  <input
                    type="number"
                    value={newSavingsGoal.currentAmount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewSavingsGoal({ 
                        ...newSavingsGoal, 
                        currentAmount: value === '' ? 0 : parseFloat(value) 
                      });
                    }}
                    className="w-full pl-8 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                    min="0"
                    step="100"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={newSavingsGoal.deadline}
                  onChange={(e) =>
                    setNewSavingsGoal({ ...newSavingsGoal, deadline: e.target.value })
                  }
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowSavingsModal(false)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    editingSavingsGoal ? handleUpdateSavingsGoal : handleAddSavingsGoal
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSavingsGoal ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Set Budget</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">₹</span>
                  <input
                    type="number"
                    value={monthlyBudgetAmount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMonthlyBudgetAmount(value === '' ? 0 : parseFloat(value));
                    }}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Budgets (Optional)
                </label>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 mb-2"
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${category.color}`}
                    ></div>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400">₹</span>
                      <input
                        type="number"
                        value={categoryBudgets[category.id] || ""}
                        onChange={(e) =>
                          setCategoryBudgets({
                            ...categoryBudgets,
                            [category.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-6 pr-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-400"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBudget}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NavItem Component
const NavItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-6 py-3 text-left transition-colors ${
        active
          ? "text-blue-600 dark:text-teal-400 bg-blue-50 dark:bg-teal-500/10 border-r-4 border-blue-600 dark:border-teal-400"
          : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

// ... (rest of the code remains the same)
