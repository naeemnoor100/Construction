
import { AppState, User } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Ahmed Khan',
  email: 'ahmed@buildtrack.pro',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
};

export const INITIAL_STATE: AppState = {
  currentUser: MOCK_USER,
  theme: 'light',
  projects: [],
  vendors: [],
  materials: [],
  expenses: [],
  payments: [],
  incomes: [],
  tradeCategories: ['Material', 'Labor', 'Equipment', 'Overhead', 'Permit', 'Fuel', 'Security'],
  stockingUnits: ['Bag', 'Ton', 'KG', 'Piece', 'Cubic Meter', 'Litre', 'Feet'],
  siteStatuses: ['Upcoming', 'Active', 'On Hold', 'Completed', 'Cancelled']
};
