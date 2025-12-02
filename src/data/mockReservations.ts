import { Reservation, PendingApproval } from '../types/reservation';

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-001',
    equipmentId: '1',
    equipmentName: 'Dell XPS 13 Laptop',
    equipmentImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop',
    borrowedDate: 'Nov 15, 2025',
    expectedReturnDate: 'Nov 22, 2025',
    status: 'Active',
  },
  {
    id: 'RES-002',
    equipmentId: '3',
    equipmentName: 'Canon EOS DSLR Camera',
    equipmentImage: 'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=500&h=500&fit=crop',
    borrowedDate: 'Nov 19, 2025',
    expectedReturnDate: 'Nov 25, 2025',
    status: 'Active',
  },
  {
    id: 'RES-003',
    equipmentId: '6',
    equipmentName: 'Professional Soldering Station',
    equipmentImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop',
    borrowedDate: 'Nov 10, 2025',
    expectedReturnDate: 'Nov 20, 2025',
    status: 'Overdue',
  },
];

export const MOCK_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'APR-001',
    equipmentId: '2',
    equipmentName: 'Professional Microscope',
    equipmentImage: 'https://images.unsplash.com/photo-1576091160550-112173cba998?w=500&h=500&fit=crop',
    requestedDate: 'Nov 21, 2025',
    requestedQuantity: 2,
    purpose: 'Biology Lab Experiment',
    status: 'Pending',
  },
  {
    id: 'APR-002',
    equipmentId: '4',
    equipmentName: 'Digital Oscilloscope',
    equipmentImage: 'https://images.unsplash.com/photo-1517694712962-ea3b43a9cf22?w=500&h=500&fit=crop',
    requestedDate: 'Nov 20, 2025',
    requestedQuantity: 1,
    purpose: 'Electronics Project',
    status: 'Pending',
  },
  {
    id: 'APR-003',
    equipmentId: '7',
    equipmentName: 'Benchtop Centrifuge',
    equipmentImage: 'https://images.unsplash.com/photo-1576091160671-112b8653acad?w=500&h=500&fit=crop',
    requestedDate: 'Nov 18, 2025',
    requestedQuantity: 1,
    purpose: 'Chemistry Lab',
    status: 'Approved',
  },
];
