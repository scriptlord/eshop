import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';


const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  let responseBody = {
    "data": true,
    "message": null,
    "success": true
  }
  if (token && token.length > 20) {
    res.json(responseBody);
  } else {
    responseBody.message = []
    responseBody.message.push('Account verification failed. Try Again')
    responseBody.success = false
    responseBody.data = false
    res.json(responseBody)
  }
});


const resendLink = asyncHandler(async (req, res) => {
  let responseBody = {
    "data": true,
    "message": null,
    "success": true
  }
  const token = req.query.token;
  console.log(req.body, 'got to this place')
  if (token && token.length > 10) {
    res.json(responseBody);
  } else {
    responseBody.message = []
    responseBody.message.push('Activation email failed to send. Try Again')
    responseBody.success = false
    responseBody.data = false
    res.json(responseBody)
  }
});
// resend-forgot-password-mail
const resendForgotPasswordMail = asyncHandler(async (req, res) => {
  let responseBody = {
    "data": true,
    "message": null,
    "success": true
  }
  const email = req.query.email;
  if (email) {
    res.json(responseBody);
  } else {
    responseBody.message = []
    responseBody.message.push('Resend link failed. Try Again')
    responseBody.success = false
    responseBody.data = false
    res.json(responseBody)
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  let responseBody = {
    "data": true,
    "message": null,
    "success": true
  }

  const { Email, Token, NewPassword, ConfirmPassword } = req.body;

  if (Email && Token && NewPassword && ConfirmPassword) {

    // Check if the token is alphanumeric
    const isAlphanumeric = /^[a-z0-9]+$/i.test(Token);

    if (!isAlphanumeric) {
      responseBody.message = ['Token is invalid. It must contain only numbers and alphabets.'];
      responseBody.success = false;
      responseBody.data = false;
      res.json(responseBody);
      return;
    }

    // Check token length
    if (Token.length < 20) { // Replace 20 with your required token length
      responseBody.message = ['Token is invalid. Incorrect length.'];
      responseBody.success = false;
      responseBody.data = false;
      res.json(responseBody);
      return;
    }
    
    if (NewPassword !== ConfirmPassword) {
      responseBody.message = ['New password and confirmation password do not match.']
      responseBody.success = false
      responseBody.data = false
      res.json(responseBody);
      return;
    }

    // If all checks passed, proceed with password reset
    res.json(responseBody);

  } else {
    responseBody.message = ['Missing or invalid data.']
    responseBody.success = false
    responseBody.data = false
    res.json(responseBody)
  }
});




// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = process.env.PAGINATION_LIMIT;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    return res.json(product);
  }
  res.status(404);
  throw new Error('Resource not found');
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});



// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);

  res.json(products);
});

export {
  resendLink,
  resetPassword,
  resendForgotPasswordMail,
  getProducts,
  verifyEmail,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
};
