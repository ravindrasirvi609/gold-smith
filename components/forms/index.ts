/**
 * Barrel for the rich form kit built in Workstream 2.
 *
 * A form component should almost always import from this module — it's
 * the entry point everyone else looks at, and it lets us reorganise the
 * files below without touching callers.
 */

export { FormField } from "./form-field";
export { SectionCard } from "./section-card";
export { FormActions } from "./form-actions";
export { Combobox } from "./combobox";
export { ReferenceSelect } from "./reference-select";
export { CountryPicker, StatePicker } from "./country-state-pickers";
export {
  GstInput,
  PanInput,
  AadhaarInput,
  IfscInput,
  PincodeInput,
  MobileInput,
} from "./code-inputs";
export { MoneyInput, WeightInput, PercentInput } from "./numeric-inputs";
export { DateInput } from "./date-input";
