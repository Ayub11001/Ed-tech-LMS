import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    // All user endpoints
    @Get("me")
    @HttpCode(HttpStatus.OK)
    async getMyDetails(
        @GetUser("id") userId: string
    ): Promise<UserResponseDto> {
        return await this.userService.getDetails(userId);
    }
    
    @Delete("me")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @GetUser("id") userId: string
    ): Promise<void> {
        await this.userService.remove(userId);
    }

    @Patch("me")
    @Roles(Role.ADMIN, Role.STUDENT)
    @HttpCode(HttpStatus.OK)
    async updateDetails(
        @GetUser("id") userId: string,
        @Body() updateDto: UpdateUserDto
    ): Promise<UserResponseDto>  {
        return await this.userService.update(userId, updateDto);
    }


    // Admin endpoints

    
    // Get filtered users or get all users if no search query
    @Get("admin")
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async getAll(
        @Query() queryDto: UsersQueryDto
    ): Promise<UserResponseDto[]> {
        return await this.userService.getMany(queryDto);
    }
    
    // Get user by id (student or educator)
    @Get("admin/:id")
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async getDetailsById(
        @Param("id") userId: string
    ): Promise<UserResponseDto> {
        return await this.userService.getDetails(userId);
    }
    
    // Update educator or student
    @Patch("admin/:id")
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async updateUser(
        @Param("id") userId: string,
        @Body() updateDto: UpdateUserDto
    ): Promise<UserResponseDto>  {
        return await this.userService.update(userId, updateDto)
    }
    
    // Remove an educator or a student
    @Delete("admin/:id")
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeUser(
        @Param("id") userId: string
    ): Promise<void> {
        await this.userService.remove(userId);
    }


}
