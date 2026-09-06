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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users.service");
const logger_service_1 = require("../../common/logger/logger.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new logger_service_1.AppLogger('AuthService');
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            ...dto,
            password: hashedPassword,
        });
        this.logger.log(`New user registered: ${user.email}`);
        return this.generateTokens(user.id, user.email, user.role);
    }
    async login(dto) {
        const user = await this.validateUser(dto.email, dto.password);
        this.logger.log(`User logged in: ${user.email}`);
        return this.generateTokens(user.id, user.email, user.role);
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return user;
    }
    async refreshToken(token) {
        try {
            const payload = this.jwtService.verify(token, { secret: this.configService.get('jwt.refreshSecret') });
            return this.generateTokens(payload.sub, payload.email, payload.role);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout() {
        return { message: 'Logged out successfully' };
    }
    generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: this.configService.get('jwt.expiresIn'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.refreshSecret'),
            expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map