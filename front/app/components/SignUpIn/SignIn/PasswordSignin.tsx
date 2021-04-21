import React, { useState, useEffect } from 'react';
import { withRouter, WithRouterProps } from 'react-router';
import clHistory from 'utils/cl-router/history';

// libraries
import Link from 'utils/cl-router/Link';

// components
import PasswordInput from 'components/UI/PasswordInput';
import Button from 'components/UI/Button';
import Error from 'components/UI/Error';
import { FormLabel } from 'components/UI/FormComponents';
import { Options, Option } from 'components/SignUpIn/styles';
import PhoneOrEmailInput from '../PhoneOrEmailInput';

// services
import { signIn } from 'services/auth';

// i18n
import { InjectedIntlProps } from 'react-intl';
import { injectIntl, FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from 'components/SignUpIn/tracks';

// style
import styled from 'styled-components';

// typings
import { ISignUpInMetaData } from 'components/SignUpIn';
import { CLError, CLErrors } from 'typings';
import useFeatureFlag from 'hooks/useFeatureFlag';

const Container = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
`;

const Form = styled.form`
  width: 100%;
`;

const FormElement = styled.div`
  width: 100%;
  margin-bottom: 16px;
  position: relative;
`;

const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
`;

export interface InputProps {
  metaData: ISignUpInMetaData;
  onSignInCompleted: (userId: string) => void;
  onGoToSignUp: () => void;
  onGoToLogInOptions: () => void;
  className?: string;
}

interface Props extends InputProps, DataProps {}

type IApiErrors = {
  base: CLError[] | null;
  email: CLError[] | null;
  password: CLError[] | null;
  mobile_phone_number: CLError[] | null;
  mobile_phone_country_code: CLError[] | null;
  mobile_phone: CLError[] | null;
};

function PasswordSignin({
  onGoToLogInOptions,
  metaData,
  onGoToSignUp,
  intl: { formatMessage },
  onSignInCompleted,
  className,
}: Props & InjectedIntlProps & WithRouterProps): ReactElement {
  const passwordLoginEnabled = useFeatureFlag('password_login');
  const googleLoginEnabled = useFeatureFlag('google_login');
  const facebookLoginEnabled = useFeatureFlag('facebook_login');
  const azureAdLoginEnabled = useFeatureFlag('azure_ad_login');
  const franceconnectLoginEnabled = useFeatureFlag('franceconnect_login');

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState<string | null>(
    null
  );
  const [mobilePhoneCountryCode, setMobilePhoneCountryCode] = useState<
    string | null
  >(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errors, setErrors] = useState<IApiErrors>({
    base: null,
    email: null,
    password: null,
    mobile_phone_number: null,
    mobile_phone_country_code: null,
    mobile_phone: null,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setProcessing(true);
      const user = await signIn({
        email,
        password,
        mobile_phone_number: mobilePhoneNumber,
        mobile_phone_country_code: mobilePhoneCountryCode,
      });
      trackEventByName(tracks.signInEmailPasswordCompleted);
      onSignInCompleted(user.data.id);
    } catch (error) {
      trackEventByName(tracks.signInEmailPasswordFailed, error);
      setErrors(error.json.errors);
      setProcessing(false);
    }
  }

  function handleEmailChange(email: string) {
    setEmail(email);
    clearErrorsFor('email');
  }

  function handleMobilePhoneChange({
    number,
    countryCode,
  }: {
    number: string;
    countryCode: string;
  }) {
    setMobilePhoneNumber(number);
    setMobilePhoneCountryCode(countryCode);
    clearErrorsFor('mobile_phone_number');
    clearErrorsFor('mobile_phone_country_code');
  }

  function handlePasswordChange(password: string) {
    setPassword(password);
    clearErrorsFor('password');
  }

  function handleGoToLogInOptions(event: React.FormEvent) {
    event.preventDefault();
    onGoToLogInOptions();
  }

  function handleGoToSignUp(event: React.FormEvent) {
    event.preventDefault();

    if (metaData?.inModal || metaData?.noPushLinks) {
      onGoToSignUp();
    } else {
      clHistory.push('/sign-up');
    }
  }

  function clearErrorsFor(errorKey: string) {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [errorKey]: null,
    }));
  }

  useEffect(() => {
    trackEventByName(tracks.signInEmailPasswordEntered);

    return () => {
      trackEventByName(tracks.signInEmailPasswordExited);
    };
  }, []);

  const enabledProviders = [
    passwordLoginEnabled,
    googleLoginEnabled,
    facebookLoginEnabled,
    azureAdLoginEnabled,
    franceconnectLoginEnabled,
  ].filter((provider) => provider === true);

  return (
    <Container
      id="e2e-sign-in-email-password-container"
      className={className || ''}
    >
      <Form id="signin" onSubmit={handleSubmit} noValidate={true}>
        <FormElement>
          <PhoneOrEmailInput
            email={email}
            phoneCountryCode={mobilePhoneCountryCode}
            phoneNumber={mobilePhoneNumber}
            onPhoneChange={handleMobilePhoneChange}
            onEmailChange={handleEmailChange}
            apiErrors={errors as CLErrors}
          />
        </FormElement>

        <FormElement>
          <FormLabel htmlFor="password" labelMessage={messages.passwordLabel} />
          <PasswordInput
            id="password"
            password={password}
            onChange={handlePasswordChange}
            autocomplete="current-password"
            isLoginPasswordInput
            apiErrors={errors.password}
          />
        </FormElement>

        <FormElement>
          <ButtonWrapper>
            <Button
              onClick={handleSubmit}
              processing={processing}
              text={formatMessage(messages.submit)}
              id="e2e-signin-password-submit-button"
            />
          </ButtonWrapper>
          <Error marginTop="10px" apiErrors={errors.base} fieldName="sign_in" />
        </FormElement>
      </Form>

      <Options>
        <Option>
          <Link
            to="/password-recovery"
            className="link e2e-password-recovery-link"
          >
            <FormattedMessage {...messages.forgotPassword2} />
          </Link>
        </Option>
        <Option>
          {enabledProviders.length > 1 ? (
            <button
              id="e2e-login-options"
              onClick={handleGoToLogInOptions}
              className="link"
            >
              <FormattedMessage {...messages.backToLoginOptions} />
            </button>
          ) : (
            <FormattedMessage
              {...messages.goToSignUp}
              values={{
                goToOtherFlowLink: (
                  <button id="e2e-goto-signup" onClick={handleGoToSignUp}>
                    {formatMessage(messages.signUp)}
                  </button>
                ),
              }}
            />
          )}
        </Option>
      </Options>
    </Container>
  );
}

export default withRouter<Props>(injectIntl(PasswordSignin));
