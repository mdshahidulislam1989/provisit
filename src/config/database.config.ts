import { TypeOrmModule } from '@nestjs/typeorm';

export const DBConfig = TypeOrmModule.forRoot(
  {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '1234',
        // database: 'pro_visit',
        database: 'dummy-provisit',
        entities: [__dirname + '/../db/*.entity.{js,ts}'],
        synchronize: true,
        logging: true,
      },
);
