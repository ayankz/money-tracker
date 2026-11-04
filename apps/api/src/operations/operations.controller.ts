import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { OperationsService } from './operations.service';
import { GetCurrentUserId } from 'src/common/decorators';
import { CreateOperationDto } from './dto/create-operation.dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto/update-operation.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  OperationsOverviewRangeQueryDto,
} from './dto/operations-overview-range-query.dto/operations-overview-range-query.dto';

@ApiTags('operations')
@ApiBearerAuth()
@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  findAll(@GetCurrentUserId() userId: number) {
    return this.operationsService.findAll(userId);
  }

  @Get('overview')
  getOverview(@GetCurrentUserId() userId: number) {
    return this.operationsService.getOverview(userId);
  }

  @Get('overview/range')
  getOverviewByRange(
    @GetCurrentUserId() userId: number,
    @Query() query: OperationsOverviewRangeQueryDto,
  ) {
    return this.operationsService.getOverviewByRange(userId, query);
  }

  @Get(':id')
  findOne(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.operationsService.findOne(id, userId);
  }

  @Post()
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateOperationDto) {
    return this.operationsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOperationDto,
  ) {
    return this.operationsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.operationsService.remove(id, userId);
  }
}
