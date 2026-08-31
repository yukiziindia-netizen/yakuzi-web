// Core API client
export { api, setAccessToken, getAccessToken, onApiEvent, setBaseURL } from './api';

// Auth
export {
  sendOtp,
  verifyOtp,
  registerBuyer,
  loginWithPassword,
  loginWithSimplePassword,
  loginWithGoogle,
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
  validateProductIds,
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
  getOrderInvoices,
  emailOrderInvoices,
  getOrderTracking,
  type Order,
  type OrderItem,
  type OrderListResponse,
  type CreateOrderInput,
  type Milestone,
  type OrderInvoice,
  type InvoiceLine,
  type InvoiceParty,
  type InvoiceTaxLine,
} from './modules/orders.api';

// Payments
export {
  createPayment,
  uploadPaymentProof,
  uploadPaymentProofByOrder,
  getPaymentByOrderId,
  getPaymentHistory,
  createRazorpayOrder,
  verifyRazorpayPayment,
  type Payment,
  type CreatePaymentInput,
  type RazorpayOrder,
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
  getSellerReviews,
  createReview,
  updateReview,
  deleteReview,
  deleteAdminReview,
  getReviewEligibility,
  type Review,
  type ReviewListResponse,
  type CreateReviewInput,
  type AdminReviewFilters,
  type SellerReviewFilters,
  type ReviewEligibility,
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
  uploadReviewImage,
  getPresignedUrl,
} from './modules/storage.api';

// Platform Config
export {
  getPlatformConfig,
  getComingSoonStatus,
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
  getAdminBlogPosts,
  getAdminBlogById,
  createAdminBlogPost,
  updateAdminBlogPost,
  updateAdminBlogPostStatus,
  deleteAdminBlogPost,
  getBlogAuthors,
  createBlogAuthor,
  getAdminBlogCategories,
  createAdminBlogCategory,
  type BlogPost,
  type BlogListResponse,
  type BlogAuthor,
  type BlogCategory,
  type UpsertBlogPostInput,
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
  sendChatMessageFull,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
} from './modules/chatbot.api';

// Brands
export {
  getBrands,
  type Brand,
} from './modules/brands.api';

// Banners
export {
  getBanners,
  type Banner,
} from './modules/banners.api';

// Homepage Sections
export {
  getHomepageSections,
  type HomepageSection,
  type HomepageSectionCategory,
  type HomepageSectionSubCategory,
} from './modules/homepage-sections.api';
