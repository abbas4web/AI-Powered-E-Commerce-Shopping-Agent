import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthTokens>;
    login(dto: LoginDto): Promise<AuthTokens>;
    validateUser(email: string, password: string): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    refreshToken(token: string): Promise<AuthTokens>;
    logout(): Promise<{
        message: string;
    }>;
    private generateTokens;
}
