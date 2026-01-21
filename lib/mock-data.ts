// lib/mock-data.ts

export interface Visitor {
  id: string;
  eventId: string;
  name: string;
  company: string;
  email: string;
  attribute: '医師' | 'PT' | 'OT' | 'ST' | '出展者' | 'その他';
  segment: '顧客' | '協業' | '競合';
  roles?: string[]; // Added roles field
  imageUrl?: string;
  scannedAt: string; // ISO string
  isSent: boolean;
}

export const mockVisitors: Visitor[] = [
  {
    id: '1',
    eventId: 'evt-001',
    name: '田中 太郎',
    company: '東京総合病院',
    email: 'tanaka.taro@example.com',
    attribute: '医師',
    segment: '顧客',
    roles: ['決定権者'],
    scannedAt: '2026-01-15T10:30:00Z',
    isSent: false,
  },
  {
    id: '2',
    eventId: 'evt-001',
    name: '佐藤 花子',
    company: '大阪リハビリテーションセンター',
    email: 'sato.hanako@example.com',
    attribute: 'PT',
    segment: '顧客',
    roles: ['ファン'],
    scannedAt: '2026-01-15T11:15:00Z',
    isSent: false,
  },
  {
    id: '3',
    eventId: 'evt-001',
    name: '鈴木 一郎',
    company: 'メディカルテック株式会社',
    email: 'suzuki@medical-tech.co.jp',
    attribute: '出展者',
    segment: '協業',
    scannedAt: '2026-01-15T09:45:00Z',
    isSent: true,
  },
  {
    id: '4',
    eventId: 'evt-001',
    name: '高橋 優子',
    company: '福岡介護施設',
    email: 'takahashi@fukuoka-care.jp',
    attribute: 'OT',
    segment: '顧客',
    roles: ['起案者', 'ファン'],
    scannedAt: '2026-01-15T13:20:00Z',
    isSent: false,
  },
];

export const mockEvents = [
  {
    id: 'evt-001',
    name: '第57回日本作業療法学会',
    date: '2026-01-15',
  }
];

export const attributes = ['医師', 'PT', 'OT', 'ST', '出展者', 'その他'] as const;
export const segments = ['顧客', '協業', '競合'] as const;
export const roles = ['決定権者', '起案者', 'ファン'] as const;
