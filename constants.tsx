
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
    },
    {
      id: 'v3',
      name: 'Expert Plumbing Solutions',
      contact: '+1 555-0103',
      category: 'Labor',
      email: 'service@expertplumbing.com',
      balance: 0
    }
  ],
  materials: [
    {
      id: 'm1',
      name: 'OPC Cement',
      unit: 'Bag',
      costPerUnit: 12,
      totalPurchased: 5000,
      totalUsed: 3200,
      history: [
        { id: 'h1', date: '2023-11-05', type: 'Purchase', quantity: 2000, note: 'Opening Stock' },
        { id: 'h2', date: '2023-11-20', type: 'Usage', quantity: 800, note: 'Foundation phase' },
        { id: 'h3', date: '2024-01-15', type: 'Purchase', quantity: 3000, note: 'Main structure order' },
        { id: 'h4', date: '2024-02-10', type: 'Usage', quantity: 1200, note: 'Ground floor slab' },
        { id: 'h5', date: '2024-03-01', type: 'Usage', quantity: 1200, note: 'First floor slab' },
      ]
    },
    {
      id: 'm2',
      name: 'Steel TMT Bars 12mm',
      unit: 'Ton',
      costPerUnit: 850,
      totalPurchased: 200,
      totalUsed: 145,
      history: [
        { id: 'h6', date: '2023-11-10', type: 'Purchase', quantity: 100, note: 'Foundation steel' },
        { id: 'h7', date: '2023-12-05', type: 'Usage', quantity: 45, note: 'Column rebar' },
        { id: 'h8', date: '2024-01-20', type: 'Purchase', quantity: 100, note: 'Second batch' },
        { id: 'h9', date: '2024-02-15', type: 'Usage', quantity: 60, note: 'Beam reinforcement' },
        { id: 'h10', date: '2024-03-05', type: 'Usage', quantity: 40, note: 'Floor slab reinforcement' },
      ]
    },
    {
      id: 'm3',
      name: 'River Sand',
      unit: 'Cubic Meter',
      costPerUnit: 45,
      totalPurchased: 1000,
      totalUsed: 750,
      history: [
        { id: 'h11', date: '2023-11-12', type: 'Purchase', quantity: 500, note: 'Initial supply' },
        { id: 'h12', date: '2024-01-05', type: 'Usage', quantity: 300, note: 'Plastering phase 1' },
        { id: 'h13', date: '2024-02-01', type: 'Purchase', quantity: 500, note: 'Refill' },
        { id: 'h14', date: '2024-03-10', type: 'Usage', quantity: 450, note: 'Floor leveling' },
      ]
    }
  ],
  expenses: [
    {
      id: 'e1',
      date: '2024-03-01',
      projectId: 'p1',
      vendorId: 'v1',
      materialId: 'm1',
      amount: 6000,
      paymentMethod: 'Bank',
      notes: 'Initial cement stock for foundation.',
      category: 'Material'
    },
    {
      id: 'e2',
      date: '2024-03-05',
      projectId: 'p1',
      vendorId: 'v3',
      amount: 2500,
      paymentMethod: 'Online',
      notes: 'Plumbing roughed-in for floor 1.',
      category: 'Labor'
    }
  ],
  payments: [
    {
      id: 'pay1',
      date: '2024-03-02',
      vendorId: 'v1',
      projectId: 'p1',
      amount: 5000,
      method: 'Bank',
      reference: 'TXN-98765'
    }
  ]
};
