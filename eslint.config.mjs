import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['Documentation/**', 'Dynamic Workflow/**'],
  },
  {
    files: [
      'app/actions/workflow.ts',
      'app/api/graphql/route.ts',
      'app/components/NodeConfigModal.tsx',
      'app/components/useWorkflow.ts',
      'lib/graphql/resolvers.ts',
      'lib/graphql/store.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/static-components': 'off',
    },
  },
];

export default config;
