import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated_response.dto';
import { ApiAuth } from 'src/common/swagger/decorators/api-auth.decorator';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';

@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // All user endpoints
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get current user details',
    description: 'Returns the profile of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user details',
    type: UserResponseDto,
  })
  @ApiErrorResponses()
  async getMyDetails(@GetUser('id') userId: string): Promise<UserResponseDto> {
    return await this.userService.getDetails(userId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Delete current user account',
    description:
      'Soft deletes the account. If the user is a student with enrollments, their seats are released. If the user is an educator, all courses must be removed first.',
  })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiErrorResponses()
  async remove(@GetUser('id') userId: string): Promise<void> {
    await this.userService.remove(userId);
  }

  @Patch('me')
  @Roles(Role.ADMIN, Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Update current user details',
    description: 'Allows admins and students to update their profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiErrorResponses({ 409: 'Email already taken' })
  async updateDetails(
    @GetUser('id') userId: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.update(userId, updateDto);
  }

  // Admin endpoints

  @Get('admin')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'List all users (admin only)',
    description:
      'Returns a paginated list of users filtered by role or warning status.',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiErrorResponses()
  async getAll(
    @Query() queryDto: UsersQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return await this.userService.getMany(queryDto);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Get user by ID (admin only)',
    description: 'Returns details for any user.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserResponseDto,
  })
  @ApiErrorResponses()
  async getDetailsById(@Param('id') userId: string): Promise<UserResponseDto> {
    return await this.userService.getDetails(userId);
  }

  @Patch('admin/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Update user by ID (admin only)',
    description: 'Allows admins to update any user profile.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiErrorResponses({ 409: 'Email already taken' })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.update(userId, updateDto);
  }

  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({
    summary: 'Delete user by ID (admin only)',
    description:
      'Soft deletes the specified user with the same seat/account cleanup rules.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiErrorResponses()
  async removeUser(@Param('id') userId: string): Promise<void> {
    await this.userService.remove(userId);
  }
}
