// libraries
import React, { memo, useState, useCallback } from 'react';
import { get, isUndefined } from 'lodash-es';
import { adopt } from 'react-adopt';
import Observer from '@researchgate/react-intersection-observer';

// resources
import GetPost, { GetPostChildProps } from 'resources/GetPost';
import GetProject, { GetProjectChildProps } from 'resources/GetProject';
import GetComments, { GetCommentsChildProps } from 'resources/GetComments';

// utils
import { isNilOrError } from 'utils/helperUtils';

// components
import ParentCommentForm from './ParentCommentForm';
import Comments from './Comments';
import CommentingDisabled from './CommentingDisabled';
import CommentSorting from './CommentSorting';

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// style
import styled from 'styled-components';
import { colors, fontSizes, media } from 'utils/styleUtils';

// typings
import { CommentsSort } from 'services/comments';
import { IdeaCommentingDisabledReason } from 'services/ideas';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from './tracks';

const Container = styled.div``;

const StyledParentCommentForm = styled(ParentCommentForm)`
  margin-bottom: 40px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: ${fontSizes.xxxl}px;
  font-weight: 500;
  line-height: 40px;
  color: ${(props: any) => props.theme.colorText};
  margin-bottom: 0;
`;

const CommentCount = styled.span``;

const StyledCommentSorting = styled(CommentSorting)`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;

  ${media.smallerThanMinTablet`
    justify-content: flex-start;
    margin-bottom: 15px;
  `}
`;

const LoadMore = styled.div`
  width: 100%;
  height: 0px;
`;

const LoadingMore = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
`;

const LoadingMoreMessage = styled.div`
  color: ${colors.label};
  font-size: ${fontSizes.medium}px;
  font-weight: 400;
`;

export interface InputProps {
  postId: string;
  postType: 'idea' | 'initiative';
  className?: string;
}

interface DataProps {
  post: GetPostChildProps;
  comments: GetCommentsChildProps;
  project: GetProjectChildProps;
}

interface Props extends InputProps, DataProps {}

const CommentsSection = memo<Props>(
  ({ postId, postType, post, comments, project, className }) => {
    const [sortOrder, setSortOrder] = useState<CommentsSort>('-new');
    const [posting, setPosting] = useState(false);
    const {
      commentsList,
      hasMore,
      onLoadMore,
      loadingInital,
      loadingMore,
      onChangeSort,
    } = comments;

    const handleSortOrderChange = useCallback((sortOrder: CommentsSort) => {
      trackEventByName(tracks.clickCommentsSortOrder);
      onChangeSort(sortOrder);
      setSortOrder(sortOrder);
    }, []);

    const handleIntersection = useCallback(
      (event: IntersectionObserverEntry, unobserve: () => void) => {
        if (event.isIntersecting) {
          onLoadMore();
          unobserve();
        }
      },
      []
    );

    const handleCommentPosting = useCallback((isPosting: boolean) => {
      setPosting(isPosting);
    }, []);

    if (
      !isNilOrError(post) &&
      !isNilOrError(commentsList) &&
      commentsList.length > 0 &&
      !isUndefined(project)
    ) {
      const commentingEnabled = get(
        post,
        'attributes.action_descriptor.commenting.enabled',
        true
      ) as boolean;
      const commentingDisabledReason = get(
        post,
        'attributes.action_descriptor.commenting.disabled_reason',
        null
      ) as IdeaCommentingDisabledReason | null;
      const phaseId = isNilOrError(project)
        ? undefined
        : project.relationships?.current_phase?.data?.id;
      const commentCount = commentsList.length;

      return (
        <Container className={className || ''}>
          <CommentingDisabled
            commentingEnabled={commentingEnabled}
            commentingDisabledReason={commentingDisabledReason}
            projectId={get(post, 'relationships.project.data.id')}
            phaseId={phaseId}
            postId={postId}
            postType={postType}
          />

          <Header>
            <Title id="comments-main-title">
              <FormattedMessage {...messages.invisibleTitleComments} />{' '}
              <CommentCount>({commentCount})</CommentCount>
            </Title>
            <StyledCommentSorting
              onChange={handleSortOrderChange}
              selectedValue={[sortOrder]}
            />
          </Header>

          <StyledParentCommentForm
            postId={postId}
            postType={postType}
            postingComment={handleCommentPosting}
          />

          <Comments
            postId={postId}
            postType={postType}
            allComments={commentsList}
            loading={loadingInital}
          />

          {hasMore && !loadingMore && (
            <Observer onChange={handleIntersection} rootMargin="3000px">
              <LoadMore />
            </Observer>
          )}

          {loadingMore && !posting && (
            <LoadingMore>
              <LoadingMoreMessage>
                <FormattedMessage {...messages.loadingMoreComments} />
              </LoadingMoreMessage>
            </LoadingMore>
          )}
        </Container>
      );
    }

    return null;
  }
);

const Data = adopt<DataProps, InputProps>({
  post: ({ postId, postType, render }) => (
    <GetPost id={postId} type={postType}>
      {render}
    </GetPost>
  ),
  comments: ({ postId, postType, render }) => (
    <GetComments postId={postId} postType={postType}>
      {render}
    </GetComments>
  ),
  project: ({ post, render }) => (
    <GetProject projectId={get(post, 'relationships.project.data.id')}>
      {render}
    </GetProject>
  ),
});

export default memo<InputProps>((inputProps: InputProps) => (
  <Data {...inputProps}>
    {(dataProps) => <CommentsSection {...inputProps} {...dataProps} />}
  </Data>
));
