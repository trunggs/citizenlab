// Libraries
import React, { PureComponent } from 'react';
import { adopt } from 'react-adopt';
import { isNilOrError } from 'utils/helperUtils';

// Services / Data loading
import GetPollOptions, { GetPollOptionsChildProps } from 'resources/GetPollOptions';
import { IPollQuestion } from 'services/pollQuestions';
import { IPollOption, deletePollOption } from 'services/pollOptions';

import T from 'components/T';

// Components
import Button from 'components/UI/Button';
import { Icon } from 'semantic-ui-react';
import { Row, TextCell, List } from 'components/admin/ResourceList';
import FormOptionRow from './FormOptionRow';

import { Locale } from 'typings';

import styled from 'styled-components';
import { colors } from 'utils/styleUtils';

const Container = styled.div``;

const OptionsContainer = styled.div`
  margin-left: 67px;
`;

const DisabledDragHandle = styled.div`
  color: ${colors.clGreyOnGreyBackground};
  padding: 1rem;
`;

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

interface InputProps {
  question: IPollQuestion;
  collapse: () => void;
  locale: Locale;
}

interface DataProps {
  pollOptions: GetPollOptionsChildProps;
}

interface Props extends InputProps, DataProps { }

interface State {
  editingId: string | null;
}

class OptionForm extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      editingId: 'new'
    };
  }

  closeRow = () => {
    this.setState({ editingId: null });
  }

  editOption = (optionId: string) => () => {
    this.setState({ editingId: optionId });
  }

  addOption = () => {
    this.setState({ editingId: 'new' });
  }

  deleteOption = (optionId: string) => () => {
    deletePollOption(optionId);
  }

  render() {
    const { question, collapse, locale, pollOptions } = this.props;
    const { editingId } = this.state;
    return (
      <Container
        key={question.id}
        id={question.id}
        className="e2e-options-form"
      >
        <Row>
          <DisabledDragHandle>
            <Icon name="sort" />
          </DisabledDragHandle>
          <TextCell className="expand">
            <FormattedMessage
              {...messages.optionsFormHeader}
              values={{ questionTitle: <T value={question.attributes.title_multiloc} /> }}
            />
          </TextCell>
          <Button
            className="e2e-delete-question"
            onClick={collapse}
            style="secondary"
            icon="close"
          >
            <FormattedMessage  {...messages.editOptionDone}/>
          </Button>
        </Row>
        <OptionsContainer>
          <List>
            {!isNilOrError(pollOptions) && pollOptions.map((pollOption: IPollOption) => (
              editingId === pollOption.id ? (
                <FormOptionRow
                  key={pollOption.id}
                  locale={locale}
                  mode="edit"
                  closeRow={this.closeRow}
                  optionId={pollOption.id}
                  titleMultiloc={pollOption.attributes.title_multiloc}
                />
              ) : (
                  <Row key={pollOption.id}>
                    <TextCell>
                      {pollOption.attributes.title_multiloc.en}
                    </TextCell>
                    <Button
                      className="e2e-delete-option"
                      onClick={this.deleteOption(pollOption.id)}
                      style="text"
                      icon="delete"
                    >
                      <FormattedMessage {...messages.deleteOption} />
                    </Button>

                    <Button
                      className="e2e-edit-option"
                      onClick={this.editOption(pollOption.id)}
                      style="secondary"
                      icon="edit"
                    >
                      <FormattedMessage {...messages.editOption} />
                    </Button>
                  </Row>
                )))}
            {editingId === 'new' ? (
              <FormOptionRow
                key="new"
                locale={locale}
                mode="new"
                questionId={question.id}
                closeRow={this.closeRow}
              />
            ) : (
                <Button
                  className="e2e-add-option"
                  style="secondary"
                  icon="create"
                  onClick={this.addOption}
                >
                  <FormattedMessage {...messages.addOption} />
                </Button>
              )}
          </List>
        </OptionsContainer>
      </Container >
    );
  }
}

const Data = adopt<DataProps, InputProps>({
  pollOptions: ({ question, render }) => <GetPollOptions questionId={question.id} >{render}</GetPollOptions>,
});

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <OptionForm {...inputProps} {...dataProps} />}
  </Data>
);
