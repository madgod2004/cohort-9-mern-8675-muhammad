import { Router } from 'express';

import * as noteController from '../controllers/note.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema';

export const noteRouter = Router();

noteRouter.use(authenticate);

noteRouter.get('/', noteController.list);
noteRouter.post('/', validateBody(createNoteSchema), noteController.create);
noteRouter.get('/:id', noteController.get);
noteRouter.patch('/:id', validateBody(updateNoteSchema), noteController.update);
noteRouter.delete('/:id', noteController.remove);
