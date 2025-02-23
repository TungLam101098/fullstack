import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, phone, address, image } = createUserDto;

      const hashPassword = await hashPasswordHelper(password);
      const user = await this.userModel.create({
        name,
        email,
        password: hashPassword,
        phone,
        address,
        image,
      });
      return {
        _id: user._id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password')
      .sort(sort as any);
    return {
      results,
      totalPages,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    if (!mongoose.isValidObjectId(_id)) {
      throw new BadRequestException('Invalid ID');
    }

    return await this.userModel.deleteOne({ _id });
  }

  async handleRegister(createUserDto: CreateAuthDto) {
    try {
      const { name, email, password } = createUserDto;

      const hashPassword = await hashPasswordHelper(password);
      const codeId = v4();
      const user = await this.userModel.create({
        name,
        email,
        password: hashPassword,
        isActive: false,
        codeId,
        codeExpired: dayjs().add(5, 'minutes').toDate(),
      });

      this.mailerService.sendMail({
        to: user.email, // list of receivers
        subject: 'Activate your account', // Subject line
        template: 'register', // The `.pug` or `.hbs` extension is appended automatically
        context: {
          name: user?.name ?? user?.email,
          activationCode: codeId,
        },
      });

      return {
        _id: user._id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
