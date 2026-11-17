export interface Museum {
  id: string;
  name: string;
  location: string;
  /** Short mark shown on the museum card. */
  monogram: string;
}

export const museums: Museum[] = [
  {
    id: "high-atlanta",
    name: "High Museum of Art",
    location: "Atlanta, Georgia",
    monogram: "HM",
  },
];
