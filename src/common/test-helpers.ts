import {
  type DynamicModule,
  type ForwardReference,
  type INestApplication,
  type Type,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import { fluse } from 'fluse';
import typeormPlugin from 'fluse-plugin-typeorm';
import { randomUUID } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import type { Connection } from 'typeorm';

import { fakerPlugin } from '@/common/fluse-plugin-faker';

export const uuidRegex = /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/;

export const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

export const database = newDb({
  autoCreateForeignKeyIndices: true,
});

database.public.registerFunction({
  name: 'current_database',
  implementation: () => 'test',
});
database.public.registerFunction({
  name: 'uuid_generate_v4',
  returns: DataType.uuid,
  implementation: () => randomUUID(),
  impure: true,
});

export async function buildTestApplication(
  ...modules: Array<
    Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >
): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRootAsync({
        useFactory: () => ({
          type: 'postgres',
          migrations: ['src/migrations/*.ts'],
          entities: ['src/**/*.entity.ts'],
        }),
        connectionFactory: async (options) => {
          const connection = (await database.adapters.createTypeormConnection(
            options,
          )) as Connection;

          await connection.runMigrations();

          return connection;
        },
      }),
      ...modules,
    ],
  }).compile();
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.use(cookieParser(process.env.SECRET));
  useContainer(module, { fallbackOnErrors: true });

  return app.init();
}

export const { fixture, scenario } = fluse({
  plugins: {
    faker: fakerPlugin(),
    orm: typeormPlugin(),
  },
});