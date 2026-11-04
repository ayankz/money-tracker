import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { GetCurrentUserId } from 'src/common/decorators';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private accountService: AccountsService) {}
  @Get()
  getAccounts(@GetCurrentUserId() userId: number) {
    return this.accountService.getAccounts(userId);
  }

  @Post()
  createAccount(
    @GetCurrentUserId() userId: number,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountService.createAccount(userId, dto);
  }

  @Delete(':accountId')
  deleteAccount(
    @Param('accountId', ParseIntPipe) accountId: number,
    @GetCurrentUserId() userId: number,
  ) {
    return this.accountService.deleteAccount(accountId, userId);
  }
}
