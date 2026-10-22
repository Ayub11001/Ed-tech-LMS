import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health/root endpoint',
    description: 'Returns a simple message from the application',
  })
  @ApiResponse({ status: 200, description: 'Application is up', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
