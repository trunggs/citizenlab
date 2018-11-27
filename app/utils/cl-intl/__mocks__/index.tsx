// ./__mocks__/react-intl.js
import React from 'react';
import { intlShape } from 'react-intl';

const Intl = jest.genMockFromModule<any>('react-intl');

// Here goes intl context injected into component, feel free to extend
const intl = {
  formatMessage: ({ defaultMessage }) => defaultMessage
};
const injectIntl = (Node) => {
  const renderWrapped = props => <Node {...props} intl={intl} />;
  renderWrapped.displayName = Node.displayName
    || Node.name
    || 'Component';
  return renderWrapped;
};

Intl.injectIntl = injectIntl;

const { FormattedMessage } = Intl;

export {
  injectIntl,
  FormattedMessage,
};
