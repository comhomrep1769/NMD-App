export type TreatmentTabKey =
  | "guru"
  | "uploadHub"
  | "upload"
  | "uploadCases"
  | "field"
  | "search"
  | "details"
  | "calculator"
  | "cases"
  | "planner"
  | "saved";

export type TreatmentTab = {
  key: TreatmentTabKey;
  label: string;
  description: string;
};
