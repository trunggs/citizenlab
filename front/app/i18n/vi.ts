import { formatTranslationMessages } from './';
import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/vi';
// no need to call addLocaleData(enLocaleData) here because it happens by default in index.ts

addLocaleData(localeData);

const translationMessages = formatTranslationMessages(
  'vi',
  require('translations/vi.json')
);

export default translationMessages;
