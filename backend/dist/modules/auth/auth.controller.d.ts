import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    register(dto: RegisterDto, res: Response): Promise<{
        accessToken: string;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    } | undefined>;
    logout(res: Response): Promise<{
        message: string;
    }>;
    private setRefreshCookie;
    private clearRefreshCookie;
}
