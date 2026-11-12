const router = require('express').Router();
const { body, param } = require('express-validator');
const controller = require('../controllers/barberController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const fields = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Informe o nome do barbeiro.'),
  body('specialty').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 400 }),
  body('avatarUrl').optional({ values: 'falsy' }).trim().custom((value) => /^https?:\/\/\S+$/i.test(value) || /^\/images\/[\w.-]+$/.test(value)).withMessage('Foto inválida. Use um link https://... ou um caminho /images/arquivo.webp.'),
  body('active').optional().isBoolean().toBoolean()
];

router.get('/', asyncHandler(controller.list));
router.get('/manage', authenticate, authorize('admin'), asyncHandler(controller.listAll));
router.post('/', authenticate, authorize('admin'), fields, validate, asyncHandler(controller.create));
router.put('/:id', authenticate, authorize('admin'), param('id').isMongoId(), ...fields, validate, asyncHandler(controller.update));
router.delete('/:id', authenticate, authorize('admin'), param('id').isMongoId(), validate, asyncHandler(controller.remove));

module.exports = router;
