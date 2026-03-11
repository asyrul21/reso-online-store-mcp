import {
  getCategoriesAdmin,
  createCategoryByAdmin,
  updateCategoryByIdByAdmin,
  getCategoriesPublic,
} from './categories.tool';
import {
  getCollectionsAdmin,
  createCollectionByAdmin,
  updateCollectionByAdmin,
  getCollectionsPublic,
} from './collections.tool';
import {
  getProductsAdmin,
  getProductByIdAdmin,
  createProductByAdmin,
  updateProductByAdmin,
  getProductsPublic,
  getProductByIdPublic,
} from './products.tool';
import {
  getProductVariantsAdmin,
  getProductVariantByIdAdmin,
  verifyProductVariantsAdmin,
  createProductVariantByAdmin,
  updateProductVariantByAdmin,
  getProductVariantsPublic,
  getProductVariantByIdPublic,
} from './variants.tool';
import {
  getProductOptionsAdmin,
  getProductOptionByIdAdmin,
  createProductOptionByAdmin,
  updateProductOptionByAdmin,
  getProductOptionsPublic,
} from './options.tool';
import {
  getProductOptionValuesAdmin,
  getProductOptionValueByIdAdmin,
  createOptionValueByAdmin,
  updateOptionValueByAdmin,
} from './optionValues.tool';
import {
  updateReviewByAdmin,
  getProductReviews,
  createProductReview,
  updateProductReview,
} from './reviews.tool';
import {
  getUsersAdmin,
  updateUserByAdmin,
  getUserById,
  updateUserSelf,
} from './users.tool';
import { getUserTypesAdmin } from './userTypes.tool';
import {
  getOrdersAdmin,
  updateOrderByAdmin,
  getOrdersByUser,
  getOrderById,
} from './orders.tool';
import {
  getDiscountsAdmin,
  createDiscountByAdmin,
  updateDiscountByAdmin,
  getDiscountsPublic,
} from './discounts.tool';
import {
  getShippingPriceRulesAdmin,
  createShippingPriceRuleByAdmin,
  updateShippingPriceRuleByAdmin,
  getShippingPricePublic,
} from './shippingPriceRule.tool';
import {
  getTaxRulesAdmin,
  createTaxRuleByAdmin,
  updateTaxRuleByAdmin,
  getTaxAmountPublic,
} from './taxRule.tool';
import { getClientCurrency } from './currency.tool';
import {
  getUserAddresses,
  createShippingAddress,
  updateShippingAddress,
} from './shippingAddress.tool';
import { AiAgentTool } from '../types';

export const adminAgentTools: Record<string, AiAgentTool> = {
  // Categories
  getCategoriesAdmin,
  createCategoryByAdmin,
  updateCategoryByIdByAdmin,
  // Collections
  getCollectionsAdmin,
  createCollectionByAdmin,
  updateCollectionByAdmin,
  // Products
  getProductsAdmin,
  getProductByIdAdmin,
  createProductByAdmin,
  updateProductByAdmin,
  // Variants
  getProductVariantsAdmin,
  getProductVariantByIdAdmin,
  verifyProductVariantsAdmin,
  createProductVariantByAdmin,
  updateProductVariantByAdmin,
  // Options
  getProductOptionsAdmin,
  getProductOptionByIdAdmin,
  createProductOptionByAdmin,
  updateProductOptionByAdmin,
  // Option Values
  getProductOptionValuesAdmin,
  getProductOptionValueByIdAdmin,
  createOptionValueByAdmin,
  updateOptionValueByAdmin,
  // Reviews
  updateReviewByAdmin,
  // Users
  getUsersAdmin,
  updateUserByAdmin,
  getUserTypesAdmin,
  // Orders
  getOrdersAdmin,
  updateOrderByAdmin,
  // Discounts
  getDiscountsAdmin,
  createDiscountByAdmin,
  updateDiscountByAdmin,
  // Shipping
  getShippingPriceRulesAdmin,
  createShippingPriceRuleByAdmin,
  updateShippingPriceRuleByAdmin,
  // Tax
  getTaxRulesAdmin,
  createTaxRuleByAdmin,
  updateTaxRuleByAdmin,
  // Currency
  getClientCurrency,
};

export const clientAgentTools: Record<string, AiAgentTool> = {
  // Categories
  getCategoriesPublic,
  // Collections
  getCollectionsPublic,
  // Products
  getProductsPublic,
  getProductByIdPublic,
  // Variants
  getProductVariantsPublic,
  getProductVariantByIdPublic, // to check quantity
  // Options
  getProductOptionsPublic,
  // Reviews
  getProductReviews,
  createProductReview,
  updateProductReview,
  // Users
  getUserById,
  updateUserSelf,
  // Orders
  getOrdersByUser,
  getOrderById,
  // Discounts
  getDiscountsPublic,
  // Shipping Price
  getShippingPricePublic,
  // Tax
  getTaxAmountPublic,
  // Currency
  getClientCurrency,
  // Shipping Addresses
  getUserAddresses,
  createShippingAddress,
  updateShippingAddress,
};
