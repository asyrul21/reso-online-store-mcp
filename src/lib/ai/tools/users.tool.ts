import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getUsersAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getUsersAdmin',
    description: 'List users (admin). Supports pagination and optional keyword/userTypeId filters.',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number starting from 1 (optional).' },
        perPage: { type: 'number', description: 'Items per page (optional, default 10).' },
        keyword: { type: 'string', description: 'Optional search keyword for name or email.' },
        userTypeId: { type: 'string', description: 'Optional user type ID filter.' },
      },
    },
  },
  fn: async (
    args: { page?: number; perPage?: number; keyword?: string; userTypeId?: string },
    ctx: ToolContext,
  ) => {
    return ctx.serverClient.get('/api/admin/user', args as any);
  },
};

export const updateUserByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateUserByAdmin',
    description: `Update a user by ID (admin). Supports name, active/verified flags, and userType reassignment. AFFECTED MODULES: ${AppAllowedModules.USER}`,
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to update.' },
        name: { type: 'string', description: 'Updated name (optional).' },
        isActive: { type: 'boolean', description: 'Enable or disable the user.' },
        isVerified: { type: 'boolean', description: 'Set verification status.' },
        userTypeId: { type: 'string', description: 'Assign a different user type (optional).' },
      },
      required: ['userId'],
    },
  },
  fn: async (
    args: {
      userId: string;
      name?: string;
      isActive?: boolean;
      isVerified?: boolean;
      userTypeId?: string;
    },
    ctx: ToolContext,
  ) => {
    const { userId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/user/${userId}`, body);
  },
};

export const getUserById: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getUserById',
    description: 'Fetch a single user profile by ID. Password is omitted; includes user type.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to fetch.' },
      },
      required: ['userId'],
    },
  },
  fn: async (args: { userId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/user/${args.userId}`);
  },
};

export const updateUserSelf: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateUserSelf',
    description: `Update your own profile. Only the name field is accepted. AFFECTED MODULES: ${AppAllowedModules.USER}`,
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'ID of the user performing the update.' },
        name: { type: 'string', description: 'New name to set.' },
      },
      required: ['userId', 'name'],
    },
  },
  fn: async (args: { userId: string; name: string }, ctx: ToolContext) => {
    const { userId, ...body } = args;
    return ctx.serverClient.put(`/api/user/${userId}`, body);
  },
};
