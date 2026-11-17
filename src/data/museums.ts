export interface Museum {
  id: string;
  /** Name and subtitle shown on the welcome card, before a language is chosen. */
  name: string;
  subtitle: string;
  /** Short mark shown on the museum card. */
  monogram: string;
}

export const museums: Museum[] = [
  {
    id: "high-atlanta",
    name: "High Museum of Art",
    subtitle: "Atlanta, Georgia",
    monogram: "HM",
  },
  {
    id: "henan",
    name: "河南博物院",
    subtitle: "Henan Museum · Zhengzhou, China",
    monogram: "豫",
  },
];
