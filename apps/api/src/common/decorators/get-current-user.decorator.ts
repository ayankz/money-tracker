import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadWithRt } from '../../auth/types';
import { Request } from 'express';

interface JwtPayload {
  email: string;
  sub: number;
}
interface RequestWithUser extends Request {
  user: JwtPayload;
}
export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayloadWithRt | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!data) return request.user;
    return request.user[data] as string | number;
  },
);
