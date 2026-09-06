import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ConfigService } from '@nestjs/config';

const REFRESH_COOKIE = 'smartshop_refresh';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using HttpOnly cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
      });
      return;
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshCookie(res);
    return this.authService.logout();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string) {
    const isProd = this.configService.get<string>('app.nodeEnv') === 'production';
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,               // JS cannot read this cookie
      secure: isProd,               // HTTPS only in production
      sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-origin in prod
      maxAge: sevenDays,
      path: '/api/auth',            // Only sent to auth endpoints
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }
}
