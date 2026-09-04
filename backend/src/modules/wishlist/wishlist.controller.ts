import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@ApiTags('Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  getWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Add product to wishlist' })
  addToWishlist(@CurrentUser() user: JwtPayload, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(user.sub, dto.productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeFromWishlist(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.wishlistService.removeFromWishlist(user.sub, productId);
  }
}
