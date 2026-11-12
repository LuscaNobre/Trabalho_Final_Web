const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Informe seu nome (mínimo de 2 letras).'),
  body('email').trim().notEmpty().withMessage('Informe seu e-mail.').bail().isEmail().withMessage('E-mail inválido. Use o formato nome@exemplo.com.').toLowerCase(),
  body('phone').optional({ values: 'falsy' }).trim().custom((value) => /^\d{10,11}$/.test(value.replace(/\D/g, ''))).withMessage('Celular inválido. Use DDD + número, ex.: (95) 99999-9999.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('A senha precisa ter pelo menos 8 caracteres.')
], validate, asyncHandler(controller.register));

router.post('/login', [
  body('email').trim().notEmpty().withMessage('Informe seu e-mail.').bail().isEmail().withMessage('E-mail inválido. Use o formato nome@exemplo.com.').toLowerCase(),
  body('password').isString().notEmpty().withMessage('Informe sua senha.')
], validate, asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));
router.get('/users', authenticate, authorize('admin'), asyncHandler(controller.listUsers));

module.exports = router;
