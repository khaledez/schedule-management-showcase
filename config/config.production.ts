export const config = () => ({
    cognito: {
        userPoolId: process.env.userPoolId ||'ca-central-1_QdrFL8ZgJ',
        clientId: process.env.clientId ||'pjlj97r3fkhoibcv2t7ln8doi',
        region: 'ca-central-1',
    }
});
