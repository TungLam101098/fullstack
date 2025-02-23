import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@/decorator/customize';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async handleLogin(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @Public()
  async register(@Body() registerDto: CreateAuthDto) {
    return this.authService.register(registerDto);
  }

  @Get('mail')
  @Public()
  async sendMail() {
    this.mailerService
      .sendMail({
        to: 'n.t.lam10101998@gmail.com', // list of receivers
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'welcome', // plaintext body
        template: 'register', // The `.pug` or `.hbs` extension is appended automatically
        context: {
          name: 'Lam Nguyen',
          activationCode: 'cf1a3f828287',
        },
      })
      .then(() => {})
      .catch(() => {});

    return 'Mail sent';
  }
}
