import React, { memo, useCallback, useState } from 'react';

// components
import Link from 'utils/cl-router/Link';
import Checkbox from 'components/UI/Checkbox';
import Error from 'components/UI/Error';

// i18n
import { InjectedIntlProps } from 'react-intl';
import { injectIntl, FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// style
import styled from 'styled-components';
import { fontSizes } from 'utils/styleUtils';

// typings
import { CLError } from 'typings';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const CheckboxWrapper = styled.div`
  margin-bottom: 15px;
`;

const ConsentText = styled.div`
  color: ${(props: any) => props.theme.colorText};
  font-size: ${fontSizes.small}px;
  line-height: 21px;
  font-weight: 300;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;

  a {
    color: ${(props: any) => props.theme.colorText};
    font-weight: 400;
    text-decoration: underline;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;

    &:hover {
      color: #000;
      text-decoration: underline;
    }
  }
`;

interface Props {
  tacErrors: CLError[] | null;
  privacyErrors: CLError[] | null;
  onTacAcceptedChange: (tacAccepted: boolean) => void;
  onPrivacyAcceptedChange: (privacyAccepted: boolean) => void;
  className?: string;
}

const Consent = memo<Props & InjectedIntlProps>(
  ({
    className,
    intl: { formatMessage },
    tacErrors,
    privacyErrors,
    onTacAcceptedChange,
    onPrivacyAcceptedChange,
  }) => {
    const [tacAccepted, setTacAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const toggleTacAccepted = useCallback(() => {
      onTacAcceptedChange(!tacAccepted);
      setTacAccepted(!tacAccepted);
    }, [tacAccepted, onTacAcceptedChange]);

    const togglePrivacyAccepted = useCallback(() => {
      onPrivacyAcceptedChange(!privacyAccepted);
      setPrivacyAccepted(!privacyAccepted);
    }, [privacyAccepted, onPrivacyAcceptedChange]);

    return (
      <Container className={className}>
        <CheckboxWrapper id="e2e-terms-and-conditions-container">
          <Checkbox
            className="e2e-terms-and-conditions"
            size="20px"
            checked={tacAccepted}
            onChange={toggleTacAccepted}
            label={
              <ConsentText>
                <FormattedMessage
                  {...messages.iHaveReadAndAgreeTo}
                  values={{
                    link: (
                      <Link target="_blank" to="/pages/terms-and-conditions">
                        <FormattedMessage
                          {...messages.theTermsAndConditions}
                          values={{ field: 'terms and conditions' }}
                        />
                      </Link>
                    ),
                  }}
                />
              </ConsentText>
            }
          />
          <Error apiErrors={tacErrors} />
        </CheckboxWrapper>

        <CheckboxWrapper id="e2e-privacy-container">
          <Checkbox
            className="e2e-privacy-checkbox"
            size="20px"
            checked={privacyAccepted}
            onChange={togglePrivacyAccepted}
            label={
              <ConsentText>
                <FormattedMessage
                  {...messages.iHaveReadAndAgreeTo}
                  values={{
                    link: (
                      <Link to="/pages/privacy-policy">
                        <FormattedMessage
                          {...messages.thePrivacyPolicy}
                          values={{ field: 'privacy policy' }}
                        />
                      </Link>
                    ),
                  }}
                />
              </ConsentText>
            }
          />
          <Error apiErrors={privacyErrors} />
        </CheckboxWrapper>

        <ConsentText>
          <FormattedMessage {...messages.emailConsent} />
        </ConsentText>
      </Container>
    );
  }
);

export default injectIntl(Consent);
