import { BankConfig, BankId } from './types';

export const DEFAULT_BANKS: Record<BankId, BankConfig> = {
  sber: { id: 'sber', name: 'Сбер', limit: 5, color: 'bg-green-600', isActive: true },
  alfa: { id: 'alfa', name: 'Альфа', limit: 5, color: 'bg-red-600', isActive: true },
  tbank: { id: 'tbank', name: 'Т-Банк', limit: 4, color: 'bg-yellow-500', isActive: true },
  vtb: { id: 'vtb', name: 'ВТБ', limit: 4, color: 'bg-blue-600', isActive: true },
  yandex: { id: 'yandex', name: 'Яндекс', limit: 5, color: 'bg-red-500', isActive: true },
};

export const ESSENTIAL_KEYWORDS = ['супермаркет', 'продукты', 'магазины', 'заправки', 'азс', 'топливо', 'аптеки', 'медицина', 'supermarket', 'grocery', 'fuel', 'gas', 'pharmacy', 'medicine', 'apteka', 'azs', 'products'];
