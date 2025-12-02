export interface Equipment {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  quantityAvailable: number;
  location: string;
  status: 'Available' | 'Unavailable' | 'Maintenance';
  image: string;
  qrCode: string;
  lastMaintenance?: string; // Date string (e.g., "2025-11-20" or "Nov 20, 2025")
}
