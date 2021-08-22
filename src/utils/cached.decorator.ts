import { Logger } from '@nestjs/common';

export function Cached(keyProvider: (...args) => string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    const logger = new Logger(propertyKey.toString());
    return {
      ...descriptor,
      async value(...args) {
        const key = keyProvider(...args);
        logger.debug(`getting cached value for key: ${key}`);
        const vals = await this.cacheManager.get(key);
        if (!vals) {
          logger.debug(`cached value not found .. calling the function`);
          const result = await descriptor.value.call(this, ...args);
          this.cacheManager.set(key, result);
          return result;
        }
        return vals;
      },
    };
  };
}
