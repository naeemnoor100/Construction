
import { AppState, User } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Arjun Sharma',
  email: 'arjun@buildtrack.pro',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
};

export const INITIAL_STATE: AppState = {
  currentUser: MOCK_USER,
  projects: [
    {
      id: 'p1',
      name: 'Skyline Residency',
      client: 'Vertex Real Estate',
      location: 'South Mumbai, MH',
      startDate: '2023-11-01',
      endDate: '2024-12-15',
      budget: 15000000,
      status: 'Active',
      description: 'Luxury high-rise residential complex with 48 premium units and rooftop amenities.'
    },
    {
      id: 'p2',
      name: 'Riverfront Commercial Plaza',
      client: 'Metro Corp',
      location: 'Ahmedabad, GJ',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      budget: 4500000,
      status: 'On Hold',
      description: 'G+4 commercial building featuring flexible office spaces and retail frontages.'
    },
    {
      id: 'p3',
      name: 'Emerald Garden Society',
      client: 'Greenfield Developers',
      location: 'Pune, MH',
      startDate: '2024-02-01',
      endDate: '2025-05-20',
      budget: 28000000,
      status: 'Active',
      description: 'Sustainable eco-friendly housing society with extensive landscaping and solar grid.'
    },
    {
      id: 'p4',
      name: 'TechHub Innovation Center',
      client: 'InnoSpace Solutions',
      location: 'Bangalore, KA',
      startDate: '2023-08-10',
      endDate: '2024-04-15',
      budget: 9200000,
      status: 'Active',
      description: 'Modern IT workspace designed for high-growth tech startups.'
    }
  ],
  vendors: [
    {
      id: 'v1',
      name: 'Apex Cement & Concrete',
      contact: '+91 98765-43210',
      category: 'Material',
      email: 'sales@apexcement.in',
      balance: 125000
    },
    {
      id: 'v2',
      name: 'Dynamic Steel Industries',
      contact: '+91 98765-43211',
      category: 'Material',
      email: 'orders@dynamicsteel.com',
      balance: 450000
    },
    {
      id: 'v3',
      name: 'VoltSafe Electricals',
      contact: '+91 98765-43212',
      category: 'Equipment',
      email: 'support@voltsafe.in',
      balance: 82000
    },
    {
      id: 'v4',
      name: 'Elite Labor Solutions',
      contact: '+91 98765-43213',
      category: 'Labor',
      email: 'hr@elitelabor.co.in',
      balance: 15000
    },
    {
      id: 'v5',
      name: 'AquaFlow Plumbing',
      contact: '+91 98765-43214',
      category: 'Material',
      email: 'billing@aquaflow.com',
      balance: 34000
    }
  ],
  materials: [
    {
      id: 'm1',
      name: 'UltraTech OPC Cement',
      unit: 'Bag',
      costPerUnit: 420,
      totalPurchased: 5000,
      totalUsed: 3200,
      history: [
        { id: 'h1', date: '2024-01-10', type: 'Purchase', quantity: 2000, vendorId: 'v1', note: 'Initial foundation stock' },
        { id: 'h2', date: '2024-01-20', type: 'Usage', quantity: 1200, projectId: 'p1', note: 'Basement slab casting' },
        { id: 'h7', date: '2024-02-15', type: 'Purchase', quantity: 3000, vendorId: 'v1', note: 'Stock for first floor columns' }
      ]
    },
    {
      id: 'm2',
      name: 'TMT Steel Bars (12mm)',
      unit: 'Ton',
      costPerUnit: 68000,
      totalPurchased: 120,
      totalUsed: 45,
      history: [
        { id: 'h3', date: '2024-02-05', type: 'Purchase', quantity: 80, vendorId: 'v2', note: 'Bulk purchase for TechHub' },
        { id: 'h4', date: '2024-02-15', type: 'Usage', quantity: 45, projectId: 'p4', note: 'Column reinforcement' },
        { id: 'h8', date: '2024-03-01', type: 'Purchase', quantity: 40, vendorId: 'v2', note: 'Inventory restock' }
      ]
    },
    {
      id: 'm3',
      name: 'M-Sand (Graded)',
      unit: 'Cubic Meter',
      costPerUnit: 1800,
      totalPurchased: 800,
      totalUsed: 350,
      history: [
        { id: 'h5', date: '2024-03-01', type: 'Purchase', quantity: 800, vendorId: 'v1', note: 'Bulk sand delivery' },
        { id: 'h9', date: '2024-03-10', type: 'Usage', quantity: 350, projectId: 'p1', note: 'Masonry wall construction' }
      ]
    },
    {
      id: 'm4',
      name: 'Red Clay Bricks',
      unit: 'Piece',
      costPerUnit: 12,
      totalPurchased: 50000,
      totalUsed: 15000,
      history: [
        { id: 'h6', date: '2024-03-10', type: 'Purchase', quantity: 50000, vendorId: 'v5', note: 'Wall partitioning batch' },
        { id: 'h10', date: '2024-03-20', type: 'Usage', quantity: 15000, projectId: 'p3', note: 'Compound wall' }
      ]
    }
  ],
  expenses: [
    {
      id: 'e1',
      date: '2024-03-01',
      projectId: 'p1',
      amount: 840000,
      paymentMethod: 'Bank',
      notes: 'Purchase of 2000 cement bags from Apex.',
      category: 'Material',
      vendorId: 'v1'
    },
    {
      id: 'e2',
      date: '2024-03-05',
      projectId: 'p4',
      amount: 5440000,
      paymentMethod: 'Online',
      notes: 'Major steel reinforcement procurement for structural frame.',
      category: 'Material',
      vendorId: 'v2'
    },
    {
      id: 'e3',
      date: '2024-03-12',
      projectId: 'p3',
      amount: 150000,
      paymentMethod: 'Cash',
      notes: 'Weekly labor wages for excavation and site clearing.',
      category: 'Labor',
      vendorId: 'v4'
    },
    {
      id: 'e4',
      date: '2024-03-15',
      projectId: 'p1',
      amount: 55000,
      paymentMethod: 'Bank',
      notes: 'Crane rental for material lifting to upper floors.',
      category: 'Equipment',
      vendorId: 'v3'
    },
    {
      id: 'e5',
      date: '2024-03-18',
      projectId: 'p4',
      amount: 22000,
      paymentMethod: 'Online',
      notes: 'Site security and temporary lighting permits.',
      category: 'Permit'
    }
  ],
  payments: [
    {
      id: 'pay1',
      date: '2024-03-10',
      vendorId: 'v1',
      projectId: 'p1',
      amount: 500000,
      method: 'Bank',
      reference: 'TXN-9821-B-ALPHA'
    },
    {
      id: 'pay2',
      date: '2024-03-20',
      vendorId: 'v2',
      projectId: 'p4',
      amount: 2500000,
      method: 'Online',
      reference: 'UPI-STEEL-001-TECHHUB'
    },
    {
      id: 'pay3',
      date: '2024-03-25',
      vendorId: 'v4',
      projectId: 'p3',
      amount: 135000,
      method: 'Cash',
      reference: 'WAGE-P3-WK12'
    }
  ],
  incomes: [
    {
      id: 'inc1',
      projectId: 'p1',
      date: '2023-11-15',
      amount: 3000000,
      description: 'Project Advance Payment',
      method: 'Bank'
    },
    {
      id: 'inc2',
      projectId: 'p1',
      date: '2024-02-10',
      amount: 2500000,
      description: 'Completion of Excavation Milestone',
      method: 'Bank'
    },
    {
      id: 'inc3',
      projectId: 'p4',
      date: '2023-09-01',
      amount: 2000000,
      description: 'Mobilization Fund Retainer',
      method: 'Bank'
    },
    {
      id: 'inc4',
      projectId: 'p4',
      date: '2024-01-20',
      amount: 3500000,
      description: 'Sub-structure Framework Completion',
      method: 'Bank'
    },
    {
      id: 'inc5',
      projectId: 'p3',
      date: '2024-02-15',
      amount: 5000000,
      description: 'Land Development & Grading Phase Completion',
      method: 'Online'
    }
  ]
};
