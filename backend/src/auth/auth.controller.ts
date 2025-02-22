import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async signIn(@Body() createAuthDto: CreateAuthDto) {
    const { email, password } = createAuthDto;
    return this.authService.signIn(email, password);
  }
}
