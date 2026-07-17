export interface Category {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'baby',
    emoji: '👶',
    label: 'Baby Photos',
    prompt: 'A photo of yourself as a baby or toddler (ages 0–4) — nothing too identifiable!',
  },
  {
    id: 'college',
    emoji: '🎓',
    label: 'College Days',
    prompt: "A photo from your college days — don't make it too obvious it's you!",
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    label: 'A Relative',
    prompt: 'A photo featuring one of your relatives — keep it a bit mysterious!',
  },
  {
    id: 'pet',
    emoji: '🐶',
    label: 'Pet Pic',
    prompt: "A photo of a pet you have or had — avoid ones that give you away!",
  },
  {
    id: 'food',
    emoji: '🍔',
    label: 'What You Ate',
    prompt: 'A photo of something delicious you ate recently — no giveaway backgrounds!',
  },
  {
    id: 'throwback',
    emoji: '🏠',
    label: 'Old Room/House',
    prompt: "A photo of a bedroom or home you used to live in — nothing too recognizable!",
  },
];

export const DEFAULT_CATEGORY_ID = CATEGORIES[0].id;

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}
