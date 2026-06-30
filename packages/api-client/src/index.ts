// Core API client
export { api, setAccessToken, getAccessToken, onApiEvent, setBaseURL } from './api';

// Auth
export {
  sendOtp,
  verifyOtp,
  registerBuyer,
  loginWithPassword,
  loginWithSimplePassword,
  refreshToken,
  logout,
  getProfile,
  resetPassword,
  type User,
  type SendOtpRequest,
  type SendOtpResponse,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
  type RegisterBuyerRequest,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from './modules/auth.api';

// Auth Context
export { AuthProvider, useAuth } from './auth/auth-provider';

// Products
export {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getManufacturers,
  getProductsByManufacturer,
  getNearbyProducts,
  getCities,
  getDiscountDetails,
  getFeaturedProducts,
  getMyWaitlist,
  addToWaitlist,
  removeFromWaitlist,
  type Product,
  type ProductListResponse,
  type CreateProductInput,
  type Category,
} from './modules/products.api';

// Cart
export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type Cart,
  type CartItem,
} from './modules/cart.api';

// Orders
export {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  updateOrderStatus,
  getOrderMilestones,
  confirmMilestonePayment,
  getOrderInvoice,
  getOrderTracking,
  type Order,
  type OrderItem,
  type OrderListResponse,
  type CreateOrderInput,
  type Milestone,
} from './modules/orders.api';

// Payments
export {
  createPayment,
  uploadPaymentProof,
  uploadPaymentProofByOrder,
  getPaymentByOrderId,
  getPaymentHistory,
  type Payment,
  type CreatePaymentInput,
} from './modules/payments.api';

// Notifications
export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
  type NotificationListResponse,
} from './modules/notifications.api';

// Reviews
export {
  getProductReviews,
  getAdminReviews,
  createReview,
  updateReview,
  deleteReview,
  deleteAdminReview,
  type Review,
  type ReviewListResponse,
  type CreateReviewInput,
} from './modules/reviews.api';

// Tickets
export {
  getTickets,
  getTicketById,
  createTicket,
  addTicketMessage,
  closeTicket,
  type Ticket,
  type TicketMessage,
  type TicketListResponse,
  type CreateTicketInput,
} from './modules/tickets.api';

// Buyer Profile
export {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  verifyPanGst,
  getBuyerInvoices,
  type BuyerProfile,
  type CreateBuyerProfileInput,
  type UpdateBuyerProfileInput,
} from './modules/buyers.api';

// Wishlist
export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  type Wishlist,
  type WishlistItem,
} from './modules/wishlist.api';

// Storage
export {
  uploadPaymentProofFile,
  uploadKycDocument,
  uploadDrugLicense,
  getPresignedUrl,
} from './modules/storage.api';

// Platform Config
export {
  getPlatformConfig,
  invalidateConfigCache,
  type PlatformConfig,
} from './modules/config.api';

// Blogs
export {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogCategories,
  createBlogCategory,
  uploadBlogImage,
  type BlogPost,
  type BlogListResponse,
} from './modules/blogs.api';

// Custom Orders
export {
  createCustomOrder,
  getAdminCustomOrders,
  updateCustomOrderStatus,
} from './modules/custom-orders.api';

// Chatbot
export {
  sendChatMessage,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
} from './modules/chatbot.api';

// Brands
export {
  getBrands,
  type Brand,
} from './modules/brands.api';
