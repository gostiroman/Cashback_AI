export type BankId = 'sber' | 'tbank' | 'alfa' | 'vtb' | 'yandex';

export interface BankConfig {
  id: BankId;
  name: string;
  limit: number;
  color: string;
  isActive: boolean;
}

export interface RawCategory {
  id: string;
  bankId: BankId;
  rawName: string; // The name exactly as read from OCR
  percentage: number;
}

export interface NormalizedGroup {
  id: string;
  name: string; // The unified name (e.g., "Fuel")
  items: RawCategory[];
}

export interface OptimizationResult {
  categoryId: string; // Corresponds to NormalizedGroup.id
  categoryName: string;
  bankSelections: {
    [key in BankId]?: {
        selected: boolean;
        percentage: number;
        isRecommended: boolean; // True if solver picked it
    };
  };
}

export interface SolverState {
  selections: Record<BankId, string[]>; // Map of BankId -> Array of NormalizedGroup IDs
}

export type AppStage = 'setup' | 'analysis' | 'normalization' | 'priorities' | 'matrix';
