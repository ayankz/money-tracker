import { SetMetadata } from '@nestjs/common';

const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
