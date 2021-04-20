import React, { ReactElement, useState } from 'react';
import { Input } from 'cl2-component-library';
import PhoneInput from 'components/UI/PhoneInput';
import { FormLabel } from 'components/UI/FormComponents';
import useAppConfiguration from 'hooks/useAppConfiguration';
import Error from 'components/UI/Error';
import { FormattedMessage } from 'utils/cl-intl';

import { CLErrors } from 'typings';

import styled from 'styled-components';

// utils
import { isNilOrError } from 'utils/helperUtils';

import messages from './messages';

const SignInMethodToggle = styled.a`
  text-decoration: underline;
  margin: 12px 0;
  display: flex;
  width: fit-content;
  cursor: pointer;
`;

interface Props {
  phoneNumber: string | null;
  phoneCountryCode: string | null;
  email: string | null;
  onPhoneChange: (mobilePhone: { countryCode: string; number: string }) => void;
  onEmailChange: (email: string) => void;
  onChangeMethod?: (method: string) => void;
  apiErrors: CLErrors;
}

export default function PhoneOrEmailInput({
  phoneNumber,
  phoneCountryCode,
  onPhoneChange,
  email,
  onEmailChange,
  onChangeMethod,
  apiErrors,
}: Props): ReactElement {
  const appConfiguration = useAppConfiguration();

  const phoneLoginEnabled =
    !isNilOrError(appConfiguration) &&
    appConfiguration.data.attributes.settings.password_login?.phone;

  const [selectedSignUpMethod, setSelectedSignUpMethod] = useState<
    'email' | 'mobile_phone'
  >('email');

  const defaultPhoneCountryCode =
    (!isNilOrError(appConfiguration) &&
      appConfiguration.data.attributes.settings.core.country_code) ||
    'us';

  function changeSignInMethod() {
    setSelectedSignUpMethod((prevMethod) => {
      const newMethod = prevMethod === 'email' ? 'mobile_phone' : 'email';
      onChangeMethod && onChangeMethod(newMethod);
      return newMethod;
    });
  }

  return (
    <>
      {phoneLoginEnabled && selectedSignUpMethod === 'mobile_phone' ? (
        <>
          <FormLabel htmlFor="phone" labelMessage={messages.phoneLabel} />
          <PhoneInput
            number={phoneNumber}
            countryCode={phoneCountryCode}
            onChange={onPhoneChange}
            defaultCountryCode={defaultPhoneCountryCode}
          />
        </>
      ) : (
        <>
          <FormLabel htmlFor="email" labelMessage={messages.emailLabel} />
          <Input
            type="email"
            id="email"
            value={email}
            onChange={onEmailChange}
            autocomplete="email"
          />
        </>
      )}

      {phoneLoginEnabled && (
        <SignInMethodToggle onClick={changeSignInMethod}>
          <FormattedMessage
            {...(selectedSignUpMethod == 'mobile_phone'
              ? messages.useEmailInstead
              : messages.usePhoneInstead)}
          />
        </SignInMethodToggle>
      )}

      {phoneLoginEnabled && selectedSignUpMethod === 'mobile_phone' ? (
        <Error marginTop="10px" apiErrors={apiErrors.mobile_phone} />
      ) : (
        <Error marginTop="10px" apiErrors={apiErrors.email} />
      )}
    </>
  );
}
