import { BankConfig, BankId, NormalizedGroup } from "../types";
import { ESSENTIAL_KEYWORDS } from "../constants";

export interface SolverResult {
  selections: Record<BankId, string[]>; // BankID -> List of Group IDs
}

export const solveCashbackMatrix = (
  groups: NormalizedGroup[],
  banks: Record<BankId, BankConfig>,
  userPriorities: string[] // List of Group IDs
): SolverResult => {
  const result: Record<BankId, string[]> = {
    sber: [], vtb: [], tbank: [], alfa: [], yandex: []
  };

  const bankCounters: Record<BankId, number> = {
    sber: 0, vtb: 0, tbank: 0, alfa: 0, yandex: 0
  };

  // Helper: Check if group is already selected in any bank
  const isGlobalSelected = (groupId: string): boolean => {
    return Object.values(result).some(list => list.includes(groupId));
  };

  // Helper: Get max percentage for a group in a specific bank
  const getPercent = (group: NormalizedGroup, bankId: BankId): number => {
    const item = group.items.find(i => i.bankId === bankId);
    return item ? item.percentage : 0;
  };

  // 1. Prepare candidates: Flatten structure for easier sorting
  // List of { groupId, bankId, percent, score }
  let candidates: { groupId: string; bankId: BankId; percent: number; score: number }[] = [];

  groups.forEach(group => {
    group.items.forEach(item => {
      if (!banks[item.bankId].isActive) return;

      let score = item.percentage;
      
      // Bonus for Priority
      if (userPriorities.includes(group.id)) score += 100;
      
      // Bonus for Essentials (if not priority)
      if (ESSENTIAL_KEYWORDS.some(k => group.name.toLowerCase().includes(k))) score += 50;

      // Super Offer Bonus
      if (item.percentage >= 10) score += 200;

      candidates.push({
        groupId: group.id,
        bankId: item.bankId,
        percent: item.percentage,
        score
      });
    });
  });

  // Sort candidates by Score desc, then Percent desc
  candidates.sort((a, b) => b.score - a.score || b.percent - a.percent);

  // 2. Greedy Allocation
  for (const candidate of candidates) {
    const { groupId, bankId } = candidate;
    const limit = banks[bankId].limit;

    // Constraint: Bank limit reached?
    if (bankCounters[bankId] >= limit) continue;

    // Constraint: Category already covered? 
    // (Relaxed rule: If it's a SUPER offer > 10%, we might take duplicates, 
    // but the prompt says Rule 4: "DO NOT pick Taxi in Bank B unless necessary")
    if (isGlobalSelected(groupId)) continue;

    // Select it
    result[bankId].push(groupId);
    bankCounters[bankId]++;
  }

  // 3. Fill remaining slots with best available remaining options
  // (Even if duplicate, if we have slots, we should use them for secondary spend)
  // Re-iterate unselected candidates
  for (const candidate of candidates) {
      const { groupId, bankId } = candidate;
      const limit = banks[bankId].limit;

      // If bank still has space
      if (bankCounters[bankId] < limit) {
          // Check if we already picked THIS group for THIS bank (cannot pick same cat twice in one bank)
          if (result[bankId].includes(groupId)) continue;
          
          // Pick it to fill slot
          result[bankId].push(groupId);
          bankCounters[bankId]++;
      }
  }

  return { selections: result };
};
