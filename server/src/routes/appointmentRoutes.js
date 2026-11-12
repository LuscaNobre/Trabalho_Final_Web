const router = require('express').Router();
const { body, param, query } = require('express-validator');
const controller = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

router.get('/availability', [
  query('barberId').isMongoId().withMessage('Escolha um barbeiro.'),
  query('serviceId').isMongoId().withMessage('Escolha um serviço.'),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Escolha uma data válida.')
], validate, asyncHandler(controller.available));
router.get('/dashboard', authenticate, authorize('admin'), asyncHandler(controller.dashboard));
router.get('/', authenticate, asyncHandler(controller.list));
router.post('/', authenticate, [
  body('barberId').isMongoId().withMessage('Escolha um barbeiro.'),
  body('serviceId').isMongoId().withMessage('Escolha um serviço.'),
  body('startsAt').isISO8601({ strict: true }).withMessage('Informe uma data e horário válidos.'),
  body('customerNote').optional().trim().isLength({ max: 300 }).withMessage('A observação deve ter até 300 caracteres.')
], validate, asyncHandler(controller.create));
router.patch('/:id/status', authenticate, param('id').isMongoId(), body('status').isIn(['confirmed', 'completed', 'cancelled']).withMessage('Status inválido.'), validate, asyncHandler(controller.updateStatus));
router.delete('/:id', authenticate, param('id').isMongoId(), validate, asyncHandler(controller.remove));

module.exports = router;
