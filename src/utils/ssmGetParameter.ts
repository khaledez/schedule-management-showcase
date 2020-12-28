import { BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

export const getSSMParameterValue = async (paramName: string) => {
  const ssm = new AWS.SSM({ apiVersion: '2014-11-06', region: 'us-east-1' });
  const options = {
    Name: paramName,
    WithDecryption: false,
  };
  try {
    const request = await ssm.getParameter(options).promise();
    return request.Parameter.Value;
  } catch (error) {
    throw new BadRequestException(error);
  }
};
