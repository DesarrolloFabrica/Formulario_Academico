import { z } from 'zod';

export const googleAuthSchema = z.object({
  credential: z.string().min(20, 'La credencial de Google es requerida')
});
