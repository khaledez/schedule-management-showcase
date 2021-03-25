import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatusOk(): any {
    return { message: 'status ok' };
  }
}
