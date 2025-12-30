import express from 'express';
import { authenticate } from '../utils/middleware.js';
import {
  getAccounts,
  connectFacebook,
  connectInstagram,
  connectLinkedIn,
  disconnectAccount,
  getAccountById,
  refreshAccountToken
} from '../controllers/account.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/facebook/connect', connectFacebook);
router.post('/instagram/connect', connectInstagram);
router.post('/linkedin/connect', connectLinkedIn);
router.post('/:id/disconnect', disconnectAccount);
router.post('/:id/refresh', refreshAccountToken);

export default router;

