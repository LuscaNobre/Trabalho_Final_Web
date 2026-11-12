const router = require('express').Router();
const { body, param } = require('express-validator');
const controller = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const categories = ['Cortes & Estilos', 'Barba & Rosto', 'Tratamentos & Rituais'];

const fields = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Informe o nome do serviço.'),
  body('category').isIn(categories).withMessage('Selecione uma categoria válida.'),
  body('description').trim().isLength({ min: 5, max: 500 }).withMessage('A descrição deve ter entre 5 e 500 caracteres.'),
  body('durationMinutes').isInt({ min: 10, max: 360 }).withMessage('A duração deve ser entre 10 e 360 minutos.'),
  body('price').isFloat({ min: 0, max: 10000 }).withMessage('Informe um preço válido.'),
  body('priceNote').optional().trim().isLength({ max: 100 }),
  body('featured').optional().isBoolean().toBoolean(), body('active').optional().isBoolean().toBoolean()
];

router.get('/', asyncHandler(controller.list));
router.get('/manage', authenticate, authorize('admin'), asyncHandler(controller.listAll));
router.post('/', authenticate, authorize('admin'), fields, validate, asyncHandler(controller.create));
router.put('/:id', authenticate, authorize('admin'), param('id').isMongoId(), ...fields, validate, asyncHandler(controller.update));
router.delete('/:id', authenticate, authorize('admin'), param('id').isMongoId(), validate, asyncHandler(controller.remove));

module.exports = router;
