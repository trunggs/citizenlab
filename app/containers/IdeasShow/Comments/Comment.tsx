// libraries
import React, { PureComponent } from 'react';
import { adopt } from 'react-adopt';
import { isNilOrError } from 'utils/helperUtils';
import { get } from 'lodash-es';

// components
import CommentHeader from './CommentHeader';
import CommentBody from './CommentBody';
import CommentFooter from './CommentFooter';

// services
import { updateComment, IUpdatedComment } from 'services/comments';

// resources
import GetComment, { GetCommentChildProps } from 'resources/GetComment';
import GetIdea, { GetIdeaChildProps } from 'resources/GetIdea';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from './tracks';

// style
import styled from 'styled-components';

// typings
import { FormikActions } from 'formik';
import { CLErrorsJSON } from 'typings';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-bottom: solid 1px #ebebeb;
  border-color: red;

  &.parent {
    padding-left: 50px;
    padding-right: 50px;
    padding-top: 20px;
    padding-bottom: 20px;
  }

  &.child {
    padding-top: 20px;
    padding-bottom: 20px;
    margin-right: 50px;
  }

  &.hideBottomBorder {
    border-bottom: none;
  }
`;

interface InputProps {
  commentId: string;
  type: 'parent' | 'child';
  hasChildComments?: boolean;
  last?: boolean;
  className?: string;
}

interface DataProps {
  comment: GetCommentChildProps;
  idea: GetIdeaChildProps;
}

interface Props extends InputProps, DataProps {}

interface State {
  spamModalVisible: boolean;
  editing: boolean;
  translateButtonClicked: boolean;
}

class Comment extends PureComponent<Props, State> {
  static defaultProps = {
    hasChildComment: false,
    last: false
  };

  constructor(props) {
    super(props);
    this.state = {
      spamModalVisible: false,
      editing: false,
      translateButtonClicked: false,
    };
  }

  onEditing = () => {
    this.setState({ editing: true });
  }

  onCancelEditing = () => {
    this.setState({ editing: false });
  }

  onCommentSave = async (comment: IUpdatedComment, formikActions: FormikActions<IUpdatedComment>) => {
    const { setSubmitting, setErrors } = formikActions;

    try {
      await updateComment(this.props.commentId, comment);
      this.setState({ editing: false });
    } catch (error) {
      if (error && error.json) {
        const apiErrors = (error as CLErrorsJSON).json.errors;
        setErrors(apiErrors);
        setSubmitting(false);
      }
    }
  }

  translateComment = () => {
    const { translateButtonClicked } = this.state;

    // tracking
    if (translateButtonClicked) {
      trackEventByName(tracks.clickGoBackToOriginalCommentButton);
    } else {
      trackEventByName(tracks.clickTranslateCommentButton);
    }

    this.setState(({ translateButtonClicked }) => ({ translateButtonClicked: !translateButtonClicked }));
  }

  render() {
    const { comment, idea, type, hasChildComments, last, className } = this.props;
    const { translateButtonClicked, editing } = this.state;

    if (!isNilOrError(comment) && !isNilOrError(idea)) {
      const commentId = comment.id;
      const ideaId = idea.id;
      const hideBottomBorder = ((type === 'parent' && !hasChildComments) || (type === 'child' && last));

      if (comment.attributes.publication_status === 'published') {
        return (
          <Container className={`${className} ${type} ${hideBottomBorder ? 'hideBottomBorder' : ''} e2e-comment`}>
            <CommentHeader
              commentId={commentId}
            />
            <CommentBody
              commentBody={comment.attributes.body_multiloc}
              editing={editing}
              onCommentSave={this.onCommentSave}
              onCancelEditing={this.onCancelEditing}
              translateButtonClicked={translateButtonClicked}
              commentId={commentId}
            />
            <CommentFooter
              ideaId={ideaId}
              commentId={commentId}
              onEditing={this.onEditing}
            />
          </Container>
        );
      }
    }

    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  comment: ({ commentId, render }) => <GetComment id={commentId}>{render}</GetComment>,
  idea: ({ comment, render }) => <GetIdea id={get(comment, 'relationships.idea.data.id')}>{render}</GetIdea>
});

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <Comment {...inputProps} {...dataProps} />}
  </Data>
);
