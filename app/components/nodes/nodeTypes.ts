export type ActionCategory = 'Flow' | 'Decision' | 'Pre Hook' | 'Post Hook';

export interface NodeDefinition {
  type: string;
  label: string;
  icon: string;
  color: string;
  category: ActionCategory;
  functionName: string;
  defaultData?: {
    condition?: string;
  };
}

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'start',
    label: 'Start',
    icon: 'ST',
    color: '#16a34a',
    category: 'Flow',
    functionName: 'Start',
  },
  {
    type: 'end',
    label: 'End',
    icon: 'EN',
    color: '#dc2626',
    category: 'Flow',
    functionName: 'End',
  },
  {
    type: 'wait',
    label: 'Wait for Time',
    icon: 'WT',
    color: '#0ea5e9',
    category: 'Flow',
    functionName: 'WaitForTime',
  },
  {
    type: 'manualReview',
    label: 'Send to Manual Review',
    icon: 'MR',
    color: '#475569',
    category: 'Flow',
    functionName: 'SendToManualReview',
  },
  {
    type: 'ifCondition',
    label: 'If / Else',
    icon: 'IF',
    color: '#d97706',
    category: 'Decision',
    functionName: 'EvaluateCondition',
    defaultData: { condition: "Transaction.Type = 'Application'" },
  },
  {
    type: 'validatePolicy',
    label: 'Validate Policy Data',
    icon: 'VP',
    color: '#2563eb',
    category: 'Pre Hook',
    functionName: 'ValidatePolicyData',
  },
  {
    type: 'calculatePrice',
    label: 'Calculate Insurance Price',
    icon: 'CP',
    color: '#7c3aed',
    category: 'Pre Hook',
    functionName: 'CalculateInsurancePrice',
  },
  {
    type: 'underwriting',
    label: 'Run Underwriting Rules',
    icon: 'UW',
    color: '#6366f1',
    category: 'Pre Hook',
    functionName: 'ExecuteUnderwritingRules',
  },
  {
    type: 'riskScore',
    label: 'Check Risk Score',
    icon: 'RS',
    color: '#4f46e5',
    category: 'Pre Hook',
    functionName: 'FetchExternalRiskScore',
  },
  {
    type: 'updatePolicyStatus',
    label: 'Update Policy Status',
    icon: 'UP',
    color: '#1d4ed8',
    category: 'Pre Hook',
    functionName: 'UpdatePolicyStatus',
  },
  {
    type: 'esign',
    label: 'Send for E-Signature',
    icon: 'ES',
    color: '#be185d',
    category: 'Post Hook',
    functionName: 'SendForESignature',
  },
  {
    type: 'processPayment',
    label: 'Process Payment',
    icon: 'PP',
    color: '#db2777',
    category: 'Post Hook',
    functionName: 'ProcessPayment',
  },
  {
    type: 'sendEmail',
    label: 'Send Email Notification',
    icon: 'EM',
    color: '#dc2626',
    category: 'Post Hook',
    functionName: 'SendEmailNotification',
  },
  {
    type: 'sendSms',
    label: 'Send SMS Notification',
    icon: 'SM',
    color: '#f43f5e',
    category: 'Post Hook',
    functionName: 'SendSMSNotification',
  },
  {
    type: 'createDocument',
    label: 'Create Policy Document',
    icon: 'PD',
    color: '#14b8a6',
    category: 'Post Hook',
    functionName: 'GeneratePolicyPDF',
  },
];

export const nodeDefinitionByType = Object.fromEntries(
  nodeDefinitions.map((definition) => [definition.type, definition])
) as Record<string, NodeDefinition>;
