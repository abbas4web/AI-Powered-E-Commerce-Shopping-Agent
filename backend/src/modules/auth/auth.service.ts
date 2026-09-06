import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AppLogger } from '../../common/logger/logger.service';

export interface AuthTokens {
  /** Short-lived — kept in memory only, never persisted */
  accessToken: string;
  /** Long-lived — set as HttpOnly cookie by the controller */
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new AppLogger('AuthService');

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    this.logger.log(`New user registered: ${user.email}`);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateUser(dto.email, dto.password);
    this.logger.log(`User logged in: ${user.email}`);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; role: string }>(
        token,
        { secret: this.configService.get<string>('jwt.refreshSecret') },
      );
      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(): Promise<{ message: string }> {
    // Refresh token is cleared by the controller via cookie
    // Phase 3: add Redis blacklist for access tokens
    return { message: 'Logged out successfully' };
  }

  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }
}
