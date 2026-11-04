import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { GetCurrentUserId } from 'src/common/decorators';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transfers')
@ApiTags('transfers')
@ApiBearerAuth()
export class TransferController {
  constructor(private transferService: TransferService) {}
  @Get()
  getTransfers(@GetCurrentUserId() userId: number) {
    return this.transferService.getTransfers(userId);
  }

  @Get(':id')
  getTransferById(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transferService.getTransferById(id, userId);
  }
  @Post()
  createTransfer(
    @GetCurrentUserId() userId: number,
    @Body() dto: CreateTransferDto,
  ) {
    return this.transferService.createTransfer(userId, dto);
  }
}
