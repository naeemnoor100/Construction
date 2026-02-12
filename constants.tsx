
import { AppState, User } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'John Builder',
  email: 'john@buildtrack.pro',
  role: 'Admin',
  avatar: 'https://picsum.photos/seed/builder/200'
};

export const INITIAL_STATE: AppState = {
  currentUser: MOCK_USER,
  projects: [
    {
      id: 'p1',
      name: 'Skyline Residency',
      client: 'Vertex Corp',
      location: 'Downtown, NY',
      startDate: '2023-11-01',
      endDate: '2024-12-15',
      budget: 1500000,
      status: 'Active',
      description: 'Luxury high-rise residential complex with 24 units.'
    },
    {
      id: 'p2',
      name: 'Oakwood Bridge',
      client: 'City Council',
      location: 'Riverside Park',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      budget: 450000,
      status: 'On Hold',
      description: 'Pedestrian bridge rehabilitation project.'
    }
  ],
  vendors: [
    {
      id: 'v1',
      name: 'Cement Masters Co.',
      contact: '+1 555-0101',
      category: 'Material',
      email: 'sales@cementmasters.com',
      balance: 12500
    },
    {
      id: 'v2',
      name: 'Iron & Steel Ltd.',
      contact: '+1 555-0102',
      category: 'Material',
      email: 'orders@ironsteel.com',
      balance: 45000
    }
  ],
  materials: [
    {
      id: 'm1',
      name: 'OPC Cement',
      unit: 'Bag',
      costPerUnit: 12,
      totalPurchased: 5000,
      totalUsed: 3200
    }
  ],
  expenses: [
    {
      id: 'e1',
      date: '2024-03-01',
      projectId: 'p1',
      amount: 6000,
      paymentMethod: 'Bank',
      notes: 'Initial cement stock.',
      category: 'Material'
    }
  ],
  payments: [],
  incomes: [
    {
      id: 'inc1',
      projectId: 'p1',
      date: '2023-11-15',
      amount: 300000,
      description: 'Project Advance Payment',
      method: 'Bank'
    },
    {
      id: 'inc2',
      projectId: 'p1',
      date: '2024-02-10',
      amount: 250000,
      description: 'Foundation Completion Milestone',
      method: 'Bank'
    }
  ]
};
