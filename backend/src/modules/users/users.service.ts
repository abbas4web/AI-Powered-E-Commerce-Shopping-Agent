import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async create(data: Prisma.UserCreateInput) {
    return this.usersRepository.create(data);
  }

  async getProfile(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    // Never return the password
    const { password: _password, ...profile } = user;
    return profile;
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.usersRepository.update(id, dto);
    const { password: _password, ...profile } = updated;
    return profile;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.usersRepository.findAll(skip, limit);
  }
}
