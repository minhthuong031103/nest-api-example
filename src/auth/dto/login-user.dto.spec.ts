import { faker } from '@faker-js/faker';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import fc from 'fast-check';

import { LoginUser } from '@/auth/dto/login-user.dto';

describe('Login user validations', () => {
  it('should be validated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .integer()
          .noBias()
          .noShrink()
          .map((seed): LoginUser => {
            faker.seed(seed);

            return plainToInstance(LoginUser, {
              password: faker.internet.password(),
              username: faker.internet.userName(),
            });
          }),
        async (data) => {
          const errors = await validate(data);

          expect(errors).toHaveLength(0);
        },
      ),
    );
  });

  it('should require all properties', async () => {
    await expect(validate(new LoginUser())).resolves.toMatchSnapshot();
  });

  it('should find the errors in the password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .record(
            {
              password: fc.oneof(
                fc.nat(),
                fc.string({ maxLength: 7 }),
                fc.string({ minLength: 31 }),
              ),
              username: fc.constant('john.doe'),
            },
            { requiredKeys: ['username'] },
          )
          .map((plain) => plainToInstance(LoginUser, plain)),
        async (data) => {
          const errors = await validate(data);

          expect(errors).toHaveLength(1);
          expect(errors[0]).toHaveProperty('property', 'password');
        },
      ),
    );
  });

  it('should find the errors in the username', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .record(
            {
              password: fc.constant('ThePassword!'),
              username: fc.oneof(
                fc.nat(),
                fc.constant(''),
                fc.string({ minLength: 31 }),
              ),
            },
            { requiredKeys: ['password'] },
          )
          .map((plain) => plainToInstance(LoginUser, plain)),
        async (data) => {
          const errors = await validate(data);

          expect(errors).toHaveLength(1);
          expect(errors[0]).toHaveProperty('property', 'username');
        },
      ),
    );
  });
});