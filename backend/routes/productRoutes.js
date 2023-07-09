import express from 'express';
const router = express.Router();
import {
  resetPassword,
  resendLink,
  verifyEmail,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  resendForgotPasswordMail,
  getTopProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/resetpassword').post(resetPassword)
router.route('/resend-forgot-password-mail').post(resendForgotPasswordMail)
router.route('/resend-link').post(resendLink)
router.route('/verify-token').post(verifyEmail)
router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.get('/top', getTopProducts);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
