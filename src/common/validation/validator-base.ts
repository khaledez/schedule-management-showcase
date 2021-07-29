import { BadRequestException } from '@nestjs/common';

export class ValidatorBase {
  /**
   * Assert if all elements inside the array of {@link #type}
   * works only for non-primitive types
   *
   * @param array Array of objects to assert
   * @param type type expected
   * @param errorMessage error message
   */
  public assertArrayElementsType(array: Array<any>, type: any, errorMessage: string) {
    const badObjects = [];
    array.forEach((item, index) => {
      if (!(item instanceof type)) {
        badObjects.push(index);
      }
    });
    if (badObjects.length !== 0) {
      throw new BadRequestException({
        msg: errorMessage,
        objects: badObjects,
      });
    }
  }
}
