import { AiAgentTool, ToolContext } from '../types';

export const updateReviewByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateReviewByAdmin',
    description:
      'Update a product review by ID (admin). Can change rating, comment, and visibility. Also updates product average rating.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        reviewId: { type: 'string', description: 'Review ID to update.' },
        rating: { type: 'number', description: 'Updated rating 1-5 (optional).' },
        comment: { type: 'string', description: 'Updated comment (optional).' },
        isHidden: { type: 'boolean', description: 'Set true to hide from public.' },
      },
      required: ['productId', 'reviewId'],
    },
  },
  fn: async (
    args: {
      productId: string;
      reviewId: string;
      rating?: number;
      comment?: string;
      isHidden?: boolean;
    },
    ctx: ToolContext,
  ) => {
    const { productId, reviewId, ...body } = args;
    return ctx.serverClient.put(
      `/api/product/${productId}/reviews/${reviewId}`,
      body,
    );
  },
};

export const getProductReviews: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductReviews',
    description: 'List reviews for a product. Supports pagination.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID whose reviews will be listed.' },
        page: { type: 'number', description: 'Page number starting from 1 (optional).' },
        perPage: { type: 'number', description: 'Items per page (optional, default 10).' },
      },
      required: ['productId'],
    },
  },
  fn: async (
    args: { productId: string; page?: number; perPage?: number },
    ctx: ToolContext,
  ) => {
    const { productId, ...params } = args;
    return ctx.serverClient.get(`/api/product/${productId}/reviews`, params as any);
  },
};

export const createProductReview: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createProductReview',
    description: 'Create a review for a product. Rating must be 1-5. Comment must be 1-500 characters.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID being reviewed.' },
        rating: { type: 'number', description: 'Rating between 1 and 5.' },
        comment: { type: 'string', description: 'Review comment (1-500 chars).' },
      },
      required: ['productId', 'rating', 'comment'],
    },
  },
  fn: async (
    args: { productId: string; rating: number; comment: string },
    ctx: ToolContext,
  ) => {
    const { productId, ...body } = args;
    return ctx.serverClient.post(`/api/product/${productId}/reviews`, body);
  },
};

export const updateProductReview: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateProductReview',
    description: 'Update your own product review. Rating, comment are updatable.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        reviewId: { type: 'string', description: 'Review ID to update.' },
        rating: { type: 'number', description: 'Updated rating 1-5 (optional).' },
        comment: { type: 'string', description: 'Updated comment (optional).' },
      },
      required: ['productId', 'reviewId'],
    },
  },
  fn: async (
    args: { productId: string; reviewId: string; rating?: number; comment?: string },
    ctx: ToolContext,
  ) => {
    const { productId, reviewId, ...body } = args;
    return ctx.serverClient.put(
      `/api/product/${productId}/reviews/${reviewId}`,
      body,
    );
  },
};
