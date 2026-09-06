"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const config_1 = require("@nestjs/config");
const REFRESH_COOKIE = 'smartshop_refresh';
let AuthController = class AuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async register(dto, res) {
        const tokens = await this.authService.register(dto);
        this.setRefreshCookie(res, tokens.refreshToken);
        return { accessToken: tokens.accessToken };
    }
    async login(dto, res) {
        const tokens = await this.authService.login(dto);
        this.setRefreshCookie(res, tokens.refreshToken);
        return { accessToken: tokens.accessToken };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (!refreshToken) {
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
            });
            return;
        }
        const tokens = await this.authService.refreshToken(refreshToken);
        this.setRefreshCookie(res, tokens.refreshToken);
        return { accessToken: tokens.accessToken };
    }
    async logout(res) {
        this.clearRefreshCookie(res);
        return this.authService.logout();
    }
    setRefreshCookie(res, token) {
        const isProd = this.configService.get('app.nodeEnv') === 'production';
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: sevenDays,
            path: '/api/auth',
        });
    }
    clearRefreshCookie(res) {
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token using HttpOnly cookie' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and clear refresh token cookie' }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map