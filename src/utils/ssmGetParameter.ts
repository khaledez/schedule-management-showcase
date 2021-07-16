import { BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ErrorCodes } from '../common/enums/error-code.enum';

export const getSSMParameterValue = async (paramName: string) => {
  const ssm = new AWS.SSM({ apiVersion: '2014-11-06' });
  const options = {
    Name: paramName,
    WithDecryption: true,
  };
  try {
    const request = await ssm.getParameter(options).promise();
    return request.Parameter.Value;
  } catch (error) {
    throw new BadRequestException({
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};
