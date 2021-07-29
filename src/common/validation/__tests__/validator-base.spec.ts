import { BadRequestException } from '@nestjs/common';
import { ValidatorBase } from 'common/validation/validator-base';

describe('ValidatorBase', () => {
  const validatorBase: ValidatorBase = new ValidatorBase();

  it('#assertArrayElementsType: Should pass successfully', () => {
    const emptyArray: Array<TestClassA> = [];
    const objectArray: Array<TestClassA> = [new TestClassA(), new TestClassA()];
    validatorBase.assertArrayElementsType(emptyArray, TestClassA, '');
    validatorBase.assertArrayElementsType(objectArray, TestClassA, '');
  });

  it('#assertArrayElementsType: Should fail with BAD_REQUEST exception', () => {
    const badArray: Array<TestClassA> = [new TestClassA(), new TestClassB(), new TestClassA(), new TestClassB()];
    const errorMessage = 'Array must have only A type objects';
    try {
      validatorBase.assertArrayElementsType(badArray, TestClassA, errorMessage);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('msg', errorMessage);
      expect(error.response).toHaveProperty('objects', [1, 3]);
    }
  });
});

class TestClassA {}
class TestClassB {}
