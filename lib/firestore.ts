import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Expense, Category, Budget, SavingsGoal } from '@/types';

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
  const expensesRef = collection(db, 'expenses');
  const docRef = await addDoc(expensesRef, {
    ...expense,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expenses');
  const q = query(
    expensesRef, 
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || doc.data().date,
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
  })) as Expense[];
};

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  const expenseRef = doc(db, 'expenses', id);
  await updateDoc(expenseRef, data);
};

export const deleteExpense = async (id: string) => {
  const expenseRef = doc(db, 'expenses', id);
  await deleteDoc(expenseRef);
};

// Categories
export const addCategory = async (category: Omit<Category, 'id'>) => {
  const categoriesRef = collection(db, 'categories');
  const docRef = await addDoc(categoriesRef, category);
  return docRef.id;
};

export const getCategories = async (userId: string): Promise<Category[]> => {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  const categoryRef = doc(db, 'categories', id);
  await updateDoc(categoryRef, data);
};

export const deleteCategory = async (id: string) => {
  const categoryRef = doc(db, 'categories', id);
  await deleteDoc(categoryRef);
};

// Budget
export const saveBudget = async (userId: string, budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const budgetRef = doc(db, 'budgets', userId);
  await setDoc(budgetRef, {
    ...budget,
    userId,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

export const getBudget = async (userId: string): Promise<Budget | null> => {
  const budgetRef = doc(db, 'budgets', userId);
  const budgetDoc = await getDoc(budgetRef);
  if (budgetDoc.exists()) {
    return { id: budgetDoc.id, ...budgetDoc.data() } as Budget;
  }
  return null;
};

// Initialize default categories for new users
export const initializeDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: 'Food', color: 'bg-blue-500' },
    { name: 'Transportation', color: 'bg-green-500' },
    { name: 'Entertainment', color: 'bg-purple-500' },
    { name: 'Education', color: 'bg-yellow-500' },
    { name: 'Shopping', color: 'bg-pink-500' },
    { name: 'Bills', color: 'bg-red-500' },
    { name: 'Other', color: 'bg-gray-500' },
  ];

  const existingCategories = await getCategories(userId);
  if (existingCategories.length === 0) {
    for (const category of defaultCategories) {
      await addCategory({ ...category, userId });
    }
  }
};

// Savings Goals
export const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const goalsRef = collection(db, 'savingsGoals');
  const goalData: any = {
    userId: goal.userId,
    goalName: goal.goalName,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Only add deadline field if it exists and is valid
  if (goal.deadline) {
    if (typeof goal.deadline === 'string' && goal.deadline.trim() !== '') {
      goalData.deadline = Timestamp.fromDate(new Date(goal.deadline));
    } else if (goal.deadline instanceof Date) {
      goalData.deadline = Timestamp.fromDate(goal.deadline);
    }
  }
  
  const docRef = await addDoc(goalsRef, goalData);
  return docRef.id;
};

export const getSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  const goalsRef = collection(db, 'savingsGoals');
  const q = query(goalsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    deadline: doc.data().deadline?.toDate?.() || doc.data().deadline,
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
  })) as SavingsGoal[];
};

export const updateSavingsGoal = async (id: string, data: Partial<SavingsGoal>) => {
  const goalRef = doc(db, 'savingsGoals', id);
  const updateData: any = {
    updatedAt: Timestamp.now(),
  };
  
  // Only add fields that are provided
  if (data.goalName !== undefined) updateData.goalName = data.goalName;
  if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
  if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount;
  
  // Convert deadline string to Timestamp if provided
  if (data.deadline !== undefined) {
    if (typeof data.deadline === 'string' && data.deadline.trim() !== '') {
      updateData.deadline = Timestamp.fromDate(new Date(data.deadline));
    } else if (data.deadline instanceof Date) {
      updateData.deadline = Timestamp.fromDate(data.deadline);
    }
  }
  
  await updateDoc(goalRef, updateData);
};

export const deleteSavingsGoal = async (id: string) => {
  const goalRef = doc(db, 'savingsGoals', id);
  await deleteDoc(goalRef);
};
