export interface Reservation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  borrowedDate: string;
  expectedReturnDate: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'checked_out' | 'returned' | 'cancelled'
  quantityRequested?: number;
  reason?: string;
  startDate?: string;
  endDate?: string;
  qrCode?: string;
  checkedOutAt?: string;
  returnedAt?: string;
  approvedAt?: string;
}

export interface PendingApproval {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  requestedDate: string;
  requestedQuantity: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}
