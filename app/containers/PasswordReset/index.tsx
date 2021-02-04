import React from 'react';
import { isString } from 'lodash-es';

// router
import clHistory from 'utils/cl-router/history';
import Link from 'utils/cl-router/Link';

// components
import { Success, IconTooltip } from 'cl2-component-library';
import Button from 'components/UI/Button';
import PasswordInput from 'components/UI/PasswordInput';
import { Helmet } from 'react-helmet';
import ContentContainer from 'components/ContentContainer';
import { FormLabel } from 'components/UI/FormComponents';
import Error from 'components/UI/Error';

// services
import { resetPassword } from 'services/auth';
import { CLError } from 'typings';
import { addErrorPayload } from 'utils/errorUtils';

// i18n
import { InjectedIntlProps } from 'react-intl';
import { injectIntl, FormattedMessage } from 'utils/cl-intl';

// style
import styled from 'styled-components';
import messages from './messages';
import { fontSizes, colors } from 'utils/styleUtils';

const Container = styled.div`
  width: 100%;
  min-height: calc(
    100vh - ${(props) => props.theme.menuHeight + props.theme.footerHeight}px
  );
  background: ${colors.background};
`;

const StyledContentContainer = styled(ContentContainer)`
  padding-bottom: 100px;
`;

const Title = styled.h1`
  width: 100%;
  color: #333;
  font-size: ${fontSizes.xxxxl}px;
  line-height: 40px;
  font-weight: 500;
  text-align: center;
  margin: 0;
  padding: 0;
  padding-top: 60px;
  margin-bottom: 50px;
`;

const StyledButton = styled(Button)`
  margin-top: 20px;
  margin-bottom: 10px;
`;

const Form = styled.form`
  width: 100%;
  max-width: 380px;
  padding-left: 20px;
  padding-right: 20px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
`;

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StyledFormLabel = styled(FormLabel)`
  width: max-content;
  margin-right: 5px;
`;

const StyledIconTooltip = styled(IconTooltip)`
  margin-bottom: 6px;
`;

type Props = {};

interface IApiErrors {
  token?: CLError[];
  password?: CLError[];
}

type ApiErrorFieldName = keyof IApiErrors;

type State = {
  token: string | null;
  password: string | null;
  hasPasswordError: boolean;
  submitError: boolean;
  processing: boolean;
  success: boolean;
  apiErrors: IApiErrors | null;
};

class PasswordReset extends React.PureComponent<
  Props & InjectedIntlProps,
  State
> {
  passwordInputElement: HTMLInputElement | null;

  constructor(props) {
    super(props);
    const query = clHistory.getCurrentLocation().query;
    const token = isString(query.token) ? query.token : null;
    this.state = {
      token,
      password: null,
      hasPasswordError: false,
      submitError: false,
      processing: false,
      success: false,
      apiErrors: null,
    };

    this.passwordInputElement = null;
  }

  componentDidMount() {
    const { token } = this.state;

    if (!isString(token)) {
      clHistory.push('/');
    } else if (this.passwordInputElement) {
      this.passwordInputElement.focus();
    }
  }

  validate = () => {
    const { hasPasswordError } = this.state;

    return !hasPasswordError;
  };

  handlePasswordOnChange = (password: string, hasPasswordError: boolean) => {
    this.setState({
      password,
      hasPasswordError,
      submitError: false,
      apiErrors: null,
    });
  };

  handlePasswordInputSetRef = (element: HTMLInputElement) => {
    this.passwordInputElement = element;
  };

  handleOnSubmit = async (event) => {
    const { password, token } = this.state;

    event.preventDefault();

    if (this.validate() && password && token) {
      try {
        this.setState({ processing: true, success: false });
        await resetPassword(password, token);
        this.setState({ password: null, processing: false, success: true });
      } catch (error) {
        let { errors } = error.json;
        const passwordResetLink = (
          <Link to="/password-recovery">
            <FormattedMessage {...messages.requestNewPasswordReset} />
          </Link>
        );

        errors = addErrorPayload(errors, 'token', 'invalid', {
          passwordResetLink,
        });

        this.setState({
          processing: false,
          success: false,
          submitError: true,
          apiErrors: errors,
        });
      }
    }
  };

  render() {
    const { formatMessage } = this.props.intl;
    const { password, processing, success, apiErrors } = this.state;
    const helmetTitle = formatMessage(messages.helmetTitle);
    const helmetDescription = formatMessage(messages.helmetDescription);
    const title = formatMessage(messages.title);
    const passwordPlaceholder = formatMessage(messages.passwordPlaceholder);
    const updatePassword = formatMessage(messages.updatePassword);
    const successMessage = success
      ? formatMessage(messages.successMessage)
      : null;

    return (
      <Container>
        <Helmet
          title={helmetTitle}
          meta={[{ name: 'description', content: helmetDescription }]}
        />

        <main>
          <StyledContentContainer>
            <Title>{title}</Title>

            <Form onSubmit={this.handleOnSubmit}>
              <LabelContainer>
                <StyledFormLabel
                  labelMessage={messages.passwordLabel}
                  htmlFor="password-reset-input"
                />
                <StyledIconTooltip content={'test'} />
              </LabelContainer>
              <PasswordInput
                id="password-reset-input"
                password={password}
                placeholder={passwordPlaceholder}
                onChange={this.handlePasswordOnChange}
                setRef={this.handlePasswordInputSetRef}
              />
              {apiErrors &&
                Object.keys(apiErrors).map((errorField: ApiErrorFieldName) => (
                  <Error
                    key={errorField}
                    apiErrors={apiErrors[errorField]}
                    fieldName={errorField}
                  />
                ))}

              <StyledButton
                size="2"
                processing={processing}
                text={updatePassword}
                onClick={this.handleOnSubmit}
              />

              <Success text={successMessage} />
            </Form>
          </StyledContentContainer>
        </main>
      </Container>
    );
  }
}

export default injectIntl<Props>(PasswordReset);
