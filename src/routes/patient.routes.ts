import { Router } from 'express';
import { checkToken } from '../middlewares/checkToken';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdminRoles, requireAnyCoordinator } from '../middlewares/checkRole';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientsByZone,
  getPatientsByFrequency,
  getPatientVisitHistory,
  updatePatientAuthorization,
  calculateNextVisit,
} from '../controllers/patient';

const router = Router();

router.use(checkToken, authMiddleware);

// Patient queries (accessible to coordinators and admins)
router.get('/search', requireAnyCoordinator, getPatients);
router.get('/search/:id', requireAnyCoordinator, getPatientById);
router.get('/by-zone/:zoneId', requireAnyCoordinator, getPatientsByZone);
router.get('/by-frequency/:frequencyId', requireAnyCoordinator, getPatientsByFrequency);
router.get('/:id/visit-history', requireAnyCoordinator, getPatientVisitHistory);
router.get('/:id/next-visit', requireAnyCoordinator, calculateNextVisit);

// Admin-only operations
router.use(requireAdminRoles);

router.post('/create', createPatient);
router.patch('/:id', updatePatient);
router.patch('/:id/authorization', updatePatientAuthorization);
router.delete('/:id', deletePatient);

export default router;
