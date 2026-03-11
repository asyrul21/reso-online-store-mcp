import { AiAgentTool, ToolContext } from '../types';

export const getUserTypesAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getUserTypesAdmin',
    description: 'List user types available for assignment (excludes the guest type).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/userTypes');
  },
};
