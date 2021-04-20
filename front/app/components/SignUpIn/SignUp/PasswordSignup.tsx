import React, { useState, useEffect } from 'react';
import { withRouter, WithRouterProps } from 'react-router';
import clHistory from 'utils/cl-router/history';
import { API_PATH } from 'containers/App/constants';
import request from 'utils/request';

// components
import { Input } from 'cl2-component-library';
import PasswordInput from 'components/UI/PasswordInput';
import Button from 'components/UI/Button';
import Error from 'components/UI/Error';
import { FormLabel } from 'components/UI/FormComponents';
import { Options, Option } from 'components/SignUpIn/styles';
import Consent from 'components/SignUpIn/SignUp/Consent';
import PhoneOrEmailInput from '../PhoneOrEmailInput';
import PasswordInputIconTooltip from 'components/UI/PasswordInput/PasswordInputIconTooltip';

// hooks
import useWindowSize from 'hooks/useWindowSize';
import useFeatureFlag from 'hooks/useFeatureFlag';
import useLocale from 'hooks/useLocale';

// services
import { signUp } from 'services/auth';

// i18n
import { InjectedIntlProps } from 'react-intl';
import { injectIntl, FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from 'components/SignUpIn/tracks';

// style
import styled from 'styled-components';
import { viewportWidths } from 'utils/styleUtils';

// typings
import { ISignUpInMetaData } from 'components/SignUpIn';
import { CLError, CLErrors } from 'typings';
import { IUserAttributes, IUser } from 'services/users';

const Container = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
`;

const Form = styled.form`
  width: 100%;
`;

const InlineFormElement = styled.div`
  display: flex;

  & > :first-child {
    input {
      position: relative;
      border-right: 0px;
      border-top-right-radius: 0px;
      border-bottom-right-radius: 0px;
    }
  }

  & > :last-child {
    input {
      position: relative;
      border-top-left-radius: 0px;
      border-bottom-left-radius: 0px;
    }
  }

  input:focus {
    z-index: 2;
  }
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

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StyledFormLabel = styled(FormLabel)`
  width: max-content;
  margin-right: 5px;
`;

const StyledConsent = styled(Consent)`
  padding-top: 10px;
`;

const StyledPasswordInputIconTooltip = styled(PasswordInputIconTooltip)`
  margin-bottom: 4px;
`;

export interface InputProps {
  metaData: ISignUpInMetaData;
  onSignInCompleted: (userId: string) => void;
  onGoToSignUp: () => void;
  onGoToLogInOptions: () => void;
  className?: string;
  hasNextStep: boolean;
  onGoToSignIn: () => void;
  onCompleted: () => void;
  onGoBack?: () => void;
}

type IUserForm = {
  [P in keyof Partial<IUserAttributes>]: any | null;
} & {
  password: string | null;
};

interface Props extends InputProps, DataProps {}

type IErrors = {
  base: CLError[] | null;
  email: CLError[] | null;
  password: CLError[] | null;
  mobile_phone_number: CLError[] | null;
  mobile_phone_country_code: CLError[] | null;
  mobile_phone: CLError[] | null;
  terms_and_conditions_accepted: CLError[] | null;
  privacy_policy_accepted: CLError[] | null;
  first_name: CLError[] | null;
  last_name: CLError[] | null;
  invitation_token: CLError[] | null;
};

function PasswordSignup({
  onGoToLogInOptions,
  metaData,
  onGoToSignUp,
  intl: { formatMessage },
  onCompleted,
  className,
  hasNextStep,
  onGoToSignIn,
  onGoBack,
}: Props & InjectedIntlProps & WithRouterProps): ReactElement {
  const windowSize = useWindowSize();
  const locale = useLocale();
  const passwordLoginEnabled = useFeatureFlag('password_login');
  const googleLoginEnabled = useFeatureFlag('google_login');
  const facebookLoginEnabled = useFeatureFlag('facebook_login');
  const azureAdLoginEnabled = useFeatureFlag('azure_ad_login');
  const franceconnectLoginEnabled = useFeatureFlag('franceconnect_login');

  const [token, setToken] = useState<string | undefined>(metaData.token);
  const [user, setUser] = useState<IUserForm>({
    first_name: null,
    last_name: null,
    email: null,
    password: null,
    mobile_phone_number: null,
    mobile_phone_country_code: null,
    registration_method: null,
    terms_and_conditions_accepted: false,
    privacy_policy_accepted: false,
    locale: locale,
  });

  const [processing, setProcessing] = useState<boolean>(false);

  const defaultErrors = {
    base: null,
    email: null,
    first_name: null,
    last_name: null,
    password: null,
    mobile_phone_number: null,
    mobile_phone_country_code: null,
    mobile_phone: null,
    terms_and_conditions_accepted: null,
    privacy_policy_accepted: null,
    invitation_token: null,
  };

  const [errors, setErrors] = useState<IErrors>(defaultErrors);

  const isInvitation = metaData.isInvitation;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setProcessing(true);
      await signUp(user, isInvitation, token);
      trackEventByName(tracks.signUpEmailPasswordStepCompleted);
      onCompleted();
    } catch (errors) {
      trackEventByName(tracks.signUpEmailPasswordStepFailed, { errors });
      setErrors(errors.json.errors);
    }
    setProcessing(false);
  }

  function handleTokenChange(token: string) {
    setToken(token);
  }

  function handleFirstNameChange(firstName: string) {
    setUserField('first_name', firstName);
  }

  function handleLastNameChange(lastName: string) {
    setUserField('last_name', lastName);
  }

  function handleTacAcceptedChange(tacAccepted: boolean) {
    setUserField('terms_and_conditions_accepted', tacAccepted);
  }

  function handlePrivacyAcceptedChange(privacyAccepted: boolean) {
    setUserField('privacy_policy_accepted', privacyAccepted);
  }

  function handleEmailChange(email: string) {
    setUserField('email', email);
    clearErrorsFor('email');
  }

  function handleMobilePhoneChange({
    number,
    countryCode,
  }: {
    number: string;
    countryCode: string;
  }) {
    setUserField('mobile_phone_number', number);
    setUserField('mobile_phone_country_code', countryCode);
    clearErrorsFor('mobile_phone_number');
    clearErrorsFor('mobile_phone_country_code');
  }

  function handlePasswordChange(password: string) {
    setUserField('password', password);
    clearErrorsFor('password');
  }

  function handleOnGoToSignIn(event: React.FormEvent) {
    event.preventDefault();

    if (metaData?.inModal || metaData?.noPushLinks) {
      onGoToSignIn();
    } else {
      clHistory.push('/sign-in');
    }
  }

  function goBackToSignUpOptions(event: React.MouseEvent) {
    event.preventDefault();

    if (metaData?.inModal || metaData?.noPushLinks) {
      onGoBack?.();
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

  function clearUserField(userField: string) {
    setUser((prevUser) => ({
      ...prevUser,
      [userField]: null,
    }));
  }

  function setUserField(userField: string, value: any) {
    clearErrorsFor(userField);
    setUser((prevUser) => ({
      ...prevUser,
      [userField]: value,
    }));
  }

  useEffect(() => {
    trackEventByName(tracks.signUpEmailPasswordStepEntered);

    return () => {
      trackEventByName(tracks.signUpEmailPasswordStepExited);
    };
  }, []);

  useEffect(() => {
    if (token) {
      request<IUser>(
        `${API_PATH}/users/by_invite/${token}`,
        null,
        { method: 'GET' },
        null
      ).then((response) => {
        const {
          email,
          first_name,
          last_name,
          mobile_phone_number,
          mobile_phone_country_code,
          terms_and_conditions_accepted,
          privacy_policy_accepted,
        } = response?.data?.attributes;

        setUser((prevUser) => ({
          ...prevUser,
          email,
          first_name,
          last_name,
          mobile_phone_number,
          mobile_phone_country_code,
          terms_and_conditions_accepted,
          privacy_policy_accepted,
        }));
      });
    }
  }, [token]);

  const isDesktop = windowSize
    ? windowSize.windowWidth > viewportWidths.largeTablet
    : true;

  const enabledProviders = [
    passwordLoginEnabled,
    googleLoginEnabled,
    facebookLoginEnabled,
    azureAdLoginEnabled,
    franceconnectLoginEnabled,
  ].filter((provider) => provider === true);

  return (
    <Container id="e2e-sign-up-email-password-container" className={className}>
      <>
        <Form
          id="e2e-signup-password"
          onSubmit={handleSubmit}
          noValidate={true}
        >
          {isInvitation && !metaData.token && (
            <FormElement id="e2e-token-container">
              <FormLabel labelMessage={messages.tokenLabel} htmlFor="token" />
              <Input
                id="token"
                type="text"
                value={token}
                placeholder={formatMessage(messages.tokenPlaceholder)}
                onChange={handleTokenChange}
                autoFocus={
                  !!(
                    isDesktop &&
                    isInvitation &&
                    !metaData.token &&
                    !metaData?.noAutofocus
                  )
                }
              />
              <Error
                fieldName="invitation_token"
                apiErrors={errors.invitation_token}
              />
            </FormElement>
          )}

          <InlineFormElement>
            <FormElement id="e2e-firstName-container">
              <FormLabel
                labelMessage={messages.firstNamesLabel}
                htmlFor="firstName"
              />
              <Input
                id="firstName"
                type="text"
                value={user.first_name}
                placeholder={formatMessage(messages.firstNamesPlaceholder)}
                onChange={handleFirstNameChange}
                autocomplete="given-name"
                autoFocus={
                  !metaData?.noAutofocus &&
                  isDesktop &&
                  (!isInvitation || !!(isInvitation && metaData.token))
                }
              />
              <Error fieldName="first_name" apiErrors={errors.first_name} />
            </FormElement>

            <FormElement id="e2e-lastName-container">
              <FormLabel
                labelMessage={messages.lastNameLabel}
                htmlFor="lastName"
              />
              <Input
                id="lastName"
                type="text"
                value={user.last_name}
                placeholder={formatMessage(messages.lastNamePlaceholder)}
                onChange={handleLastNameChange}
                autocomplete="family-name"
              />
              <Error fieldName="last_name" apiErrors={errors.last_name} />
            </FormElement>
          </InlineFormElement>

          <FormElement>
            <PhoneOrEmailInput
              email={user.email}
              phoneCountryCode={user.mobile_phone_country_code}
              phoneNumber={user.mobile_phone_number}
              onPhoneChange={handleMobilePhoneChange}
              onEmailChange={handleEmailChange}
              apiErrors={errors as CLErrors}
            />
          </FormElement>

          <FormElement id="e2e-password-container">
            <LabelContainer>
              <StyledFormLabel
                labelMessage={messages.passwordLabel}
                htmlFor="signup-password-input"
              />
              <StyledPasswordInputIconTooltip />
            </LabelContainer>
            <PasswordInput
              id="password"
              password={user.password}
              placeholder={formatMessage(messages.passwordPlaceholder)}
              onChange={handlePasswordChange}
              autocomplete="new-password"
              apiErrors={errors.password}
            />
          </FormElement>

          <FormElement>
            <StyledConsent
              tacErrors={errors.terms_and_conditions_accepted}
              privacyErrors={errors.privacy_policy_accepted}
              onTacAcceptedChange={handleTacAcceptedChange}
              onPrivacyAcceptedChange={handlePrivacyAcceptedChange}
            />
          </FormElement>

          <FormElement>
            <ButtonWrapper>
              <Button
                id="e2e-signup-password-submit-button"
                processing={processing}
                text={formatMessage(
                  hasNextStep ? messages.nextStep : messages.signUp2
                )}
                onClick={handleSubmit}
              />
            </ButtonWrapper>
          </FormElement>

          <Error apiErrors={errors.base} />
        </Form>

        <Options>
          <Option>
            {enabledProviders.length > 1 ? (
              <button onClick={goBackToSignUpOptions} className="link">
                <FormattedMessage {...messages.backToSignUpOptions} />
              </button>
            ) : (
              <FormattedMessage
                {...messages.goToLogIn}
                values={{
                  goToOtherFlowLink: (
                    <button onClick={handleOnGoToSignIn} className="link">
                      {formatMessage(messages.logIn2)}
                    </button>
                  ),
                }}
              />
            )}
          </Option>
        </Options>
      </>
    </Container>
  );
}

export default withRouter<Props>(injectIntl(PasswordSignup));
