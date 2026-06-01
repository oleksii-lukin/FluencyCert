import en from '../messages/en.json';
import uk from '../messages/uk.json';

const messagesByLocale: Record<string, any> = {en, uk};

const nextIntl = {
  defaultLocale: 'en',
  messagesByLocale,
};

export default nextIntl;
