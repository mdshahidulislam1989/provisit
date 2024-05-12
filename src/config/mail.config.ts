import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

export const MailConfig = MailerModule.forRoot({
  // transport: 'smtps://user@example.com:topsecret@smtp.example.com',
  // or
  transport: {
    host: 'smtp.gmail.com',
    secure: false,
    auth: {
      user: 'provisitapp@gmail.com',
      pass: 'ggdv ehjg mfps mcqw',
    },
  },
  defaults: {
    from: '"Pro Visit" <provisitapp@gmail.com>',
  },
  template: {
    dir: join(__dirname, '/../mail/templates'),
    adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
    options: {
      strict: true,
    },
  },
  options: {
    partials: {
      dir: join(__dirname, '/../mail/templates', 'partials'),
      options: {
        strict: true,
      },
    },
  },
});
