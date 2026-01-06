import { NormalizedGroup, RawCategory } from "../types";

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const isSimilar = (str1: string, str2: string): boolean => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  const dist = levenshtein(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return dist / maxLength < 0.4; // 40% difference threshold
};

// Common Russian mappings
const COMMON_MAPPINGS: Record<string, string[]> = {
  "Супермаркеты": ["супермаркеты", "продукты", "магазины у дома", "supermarkets", "grocery"],
  "Кафе и рестораны": ["кафе", "рестораны", "фастфуд", "fast food", "restaurants"],
  "Такси": ["такси", "taxi", "uber", "yandex go"],
  "Заправки": ["азс", "топливо", "бензин", "fuel", "gas stations"],
  "Аптеки": ["аптеки", "медицина", "лекарства", "pharmacy"],
  "Дом и ремонт": ["дом", "ремонт", "строительство", "home", "diy"],
  "Одежда и обувь": ["одежда", "обувь", "clothes", "shoes"],
};

export const normalizeCategories = (rawCategories: RawCategory[]): NormalizedGroup[] => {
  const groups: NormalizedGroup[] = [];

  rawCategories.forEach((cat) => {
    let assigned = false;

    // 1. Check strict known mappings
    for (const [groupName, keywords] of Object.entries(COMMON_MAPPINGS)) {
      if (keywords.some(k => cat.rawName.toLowerCase().includes(k))) {
        const existingGroup = groups.find(g => g.name === groupName);
        if (existingGroup) {
          existingGroup.items.push(cat);
        } else {
          groups.push({
            id: `group-${Date.now()}-${Math.random()}`,
            name: groupName,
            items: [cat]
          });
        }
        assigned = true;
        break;
      }
    }

    if (assigned) return;

    // 2. Check similarity with existing groups
    for (const group of groups) {
      if (isSimilar(group.name, cat.rawName)) {
        group.items.push(cat);
        assigned = true;
        break;
      }
    }

    // 3. Create new group
    if (!assigned) {
      groups.push({
        id: `group-${Date.now()}-${Math.random()}`,
        name: cat.rawName, // Capitalize first letter?
        items: [cat]
      });
    }
  });

  return groups.sort((a, b) => a.name.localeCompare(b.name));
};
