import React, { PureComponent } from 'react';
import { adopt } from 'react-adopt';
import clHistory from 'utils/cl-router/history';
import { isNilOrError } from 'utils/helperUtils';

// components
import Button from 'components/UI/Button';
import Icon from 'components/UI/Icon';

// services
import { dismissOnboardingCampaign, IOnboardingCampaignNames } from 'services/onboardingCampaigns';

// resources
import GetLocale, { GetLocaleChildProps } from 'resources/GetLocale';
import GetTenant, { GetTenantChildProps } from 'resources/GetTenant';
import GetAuthUser, { GetAuthUserChildProps } from 'resources/GetAuthUser';
import GetOnboardingCampaigns, { GetOnboardingCampaignsChildProps } from 'resources/GetOnboardingCampaigns';

// utils
import { trackEvent } from 'utils/analytics';
import tracks from './tracks';
import CSSTransition from 'react-transition-group/CSSTransition';

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';
import T from 'components/T';

// style
import styled, { withTheme } from 'styled-components';
import { media, fontSizes } from 'utils/styleUtils';

const contentTimeout = 350;
const contentEasing = 'cubic-bezier(0.19, 1, 0.22, 1)';
const contentDelay = 550;

const Header = styled.div`
  width: 100%;
  height: 190px;
  position: relative;
  display: flex;
  flex-direction: column;

  ${media.smallerThanMinTablet`
    height: 210px;
  `}
`;

const HeaderImageContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const HeaderImageContainerInner = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const HeaderImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeaderImageOverlay = styled.div`
  background: ${(props) => props.theme.colorMain};
  opacity: 0.9;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const HeaderContent = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 75px;
  padding-right: 75px;
  overflow: hidden;

  &.content-enter {
    opacity: 0;

    &.content-enter-active {
      opacity: 1;
      transition: all ${contentTimeout}ms ${contentEasing} ${contentDelay}ms;
    }
  }

  &.content-enter-done {
    opacity: 1;
  }

  &.content-exit {
    opacity: 1;
    transition: all ${contentTimeout}ms ${contentEasing};

    &.content-exit-active {
      opacity: 0;
    }
  }

  &.content-exit-done {
    display: none;
  }

  p {
    color: #fff;
    font-size: ${fontSizes.xxl}px;
    line-height: 33px;
    font-weight: 400;
  }

  ${media.smallerThanMaxTablet`
    padding-left: 30px;
    padding-right: 30px;
  `}

  ${media.smallerThanMinTablet`
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
  `}
`;

const HeaderContentCompleteProfile = HeaderContent.extend``;
const HeaderContentCustomCta = HeaderContent.extend``;
const HeaderContentDefault = HeaderContent.extend`
  p {
    text-align: center;
  }

  ${media.smallerThanMinTablet`
    align-items: center;
  `}
`;

const Left = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  display: flex;
  align-items: center;
  margin-right: 60px;

  ${media.smallerThanMinTablet`
    flex-basis: auto;
    flex-grow: 0;
    margin-right: 0;
  `}
`;

const Icons = styled.div`
  display: flex;
  margin-right: 30px;

  ${media.smallerThanMaxTablet`
    display: none;
  `}
`;

const NoAvatarUserIcon: any = styled(Icon)`
  fill: #fff;
  background: ${props => props.theme.colorMain};
  border-radius: 50%;
  width: 50px;
  height: 50px;
`;

const CompleteProfileIcon = styled(Icon)`
  width: 50px;
  height: 50px;
`;

const Text = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  display: flex;

  ${media.smallerThanMinTablet`
    flex-basis: auto;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  `}
`;

const Right = styled.div`
  display: flex;

  ${media.smallerThanMinTablet`
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    margin-top: 30px;
  `}
`;

const SkipButton = styled(Button)`
  margin-right: 10px;

  ${media.smallerThanMinTablet`
    order: 2;
    margin-right: 0px;
  `}
`;

const AcceptButton = styled(Button)`
  ${media.smallerThanMinTablet`
    order: 1;
    margin-bottom: 10px;
  `}
`;

export interface InputProps {
  className?: string;
}

interface DataProps {
  locale: GetLocaleChildProps;
  tenant: GetTenantChildProps;
  authUser: GetAuthUserChildProps;
  onboardingCampaigns: GetOnboardingCampaignsChildProps;
}

interface Props extends InputProps, DataProps {
  theme: any;
}

interface State { }

class SignedInHeader extends PureComponent<Props, State> {
  goToSignUpPage = () => {
    trackEvent({ ...tracks.clickCreateAccountCTA, properties: { extra: { location: 'header' } } });
    clHistory.push('/sign-up');
  }

  handleSkipButtonClick = (name: IOnboardingCampaignNames) => () => {
    dismissOnboardingCampaign(name);
  }

  handleSubmitButtonClick = () => {

  }

  render() {
    const { locale, tenant, authUser, className, onboardingCampaigns, theme } = this.props;

    if (!isNilOrError(locale) && !isNilOrError(tenant) && !isNilOrError(authUser) && !isNilOrError(onboardingCampaigns)) {
      const tenantHeaderImage = (tenant.attributes.header_bg ? tenant.attributes.header_bg.large : null);

      return (
        <Header className={className} id="hook-header">
          <HeaderImageContainer>
            <HeaderImageContainerInner>
              {tenantHeaderImage && <HeaderImage src={tenantHeaderImage} />}
              <HeaderImageOverlay />
            </HeaderImageContainerInner>
          </HeaderImageContainer>

          {/* First header state - complete profile */}
          <CSSTransition
            classNames="content"
            in={onboardingCampaigns.name === 'complete_profile'}
            timeout={onboardingCampaigns.name === 'complete_profile' ? contentTimeout + contentDelay : contentTimeout}
            mountOnEnter={true}
            unmountOnExit={true}
            enter={true}
            exit={true}
          >
            <HeaderContentCompleteProfile>
              <Left>
                <Icons>
                  <NoAvatarUserIcon name="noAvatar" />
                  <CompleteProfileIcon name="completeProfile" />
                </Icons>
                <Text>
                  <FormattedMessage {...messages.completeYourProfile} tagName="p" values={{ firstName: authUser.attributes.first_name }} />
                </Text>
              </Left>

              <Right>
                <SkipButton
                  style="primary-outlined"
                  text={<FormattedMessage {...messages.doItLater} />}
                  onClick={this.handleSkipButtonClick(onboardingCampaigns.name)}
                  borderColor="#fff"
                  textColor="#fff"
                />
                <AcceptButton
                  text={<FormattedMessage {...messages.completeProfile} />}
                  linkTo="/profile/edit"
                  bgColor="#fff"
                  textColor={theme.colorMain}
                />
              </Right>
            </HeaderContentCompleteProfile>
          </CSSTransition>

          {/* Second header state - custom CTA */}
          <CSSTransition
            classNames="content"
            in={onboardingCampaigns.name === 'custom_cta'}
            timeout={onboardingCampaigns.name === 'custom_cta' ? contentTimeout + contentDelay : contentTimeout}
            mountOnEnter={true}
            unmountOnExit={true}
            enter={true}
            exit={true}
          >
            <HeaderContentCustomCta>
              <Left>
                <Text>
                  <T as="p" value={onboardingCampaigns.cta_message_multiloc} />
                </Text>
              </Left>

              <Right>
                <SkipButton
                  style="primary-outlined"
                  text={<FormattedMessage {...messages.doItLater} />}
                  onClick={this.handleSkipButtonClick(onboardingCampaigns.name)}
                  borderColor="#fff"
                  textColor="#fff"
                />
                <AcceptButton
                  text={<T value={onboardingCampaigns.cta_button_multiloc} />}
                  linkTo={onboardingCampaigns.cta_button_link}
                  bgColor="#fff"
                  textColor={theme.colorMain}
                />
              </Right>
            </HeaderContentCustomCta>
          </CSSTransition>

          {/* Third header state - default customizable message */}
          <CSSTransition
            classNames="content"
            in={onboardingCampaigns.name === 'default'}
            timeout={onboardingCampaigns.name === 'default' ? contentTimeout + contentDelay : contentTimeout}
            mountOnEnter={true}
            unmountOnExit={true}
            enter={true}
            exit={true}
          >
            <HeaderContentDefault>
              {onboardingCampaigns.cta_message_multiloc
                ? <T as="p" value={onboardingCampaigns.cta_message_multiloc} />
                : <FormattedMessage {...messages.defaultSignedInMessage} tagName="p" values={{ firstName: authUser.attributes.first_name }}/>
              }
            </HeaderContentDefault>
          </CSSTransition>
        </Header>
      );
    }

    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  locale: <GetLocale />,
  tenant: <GetTenant />,
  authUser: <GetAuthUser />,
  onboardingCampaigns: <GetOnboardingCampaigns />
});

const SignedInHeaderWithHoC = withTheme<Props, State>(SignedInHeader);

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <SignedInHeaderWithHoC {...inputProps} {...dataProps} />}
  </Data>
);
