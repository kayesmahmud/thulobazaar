/**
 * Form Template Type Definitions
 */

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date';

export type AppliesTo = 'all' | string[];

export interface BaseField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  appliesTo: AppliesTo;
}

export interface TextField extends BaseField {
  type: 'text';
  placeholder?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface SelectField extends BaseField {
  type: 'select';
  options: string[];
}

export interface MultiselectField extends BaseField {
  type: 'multiselect';
  options: string[];
}

export interface CheckboxField extends BaseField {
  type: 'checkbox';
}

export interface DateField extends BaseField {
  type: 'date';
}

export type FormField = TextField | NumberField | SelectField | MultiselectField | CheckboxField | DateField;

export interface FormTemplate {
  name: string;
  icon: string;
  fields: FormField[];
}

export type TemplateName = 'electronics' | 'vehicles' | 'property' | 'fashion' | 'pets' | 'services' | 'general';

export type FormTemplates = Record<TemplateName, FormTemplate>;

// Category to template mapping type
export type CategoryTemplateMap = Record<string, TemplateName>;
