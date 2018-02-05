import * as React from 'react';
import { isObject, isEmpty, isEqual, has } from 'lodash';
import * as Rx from 'rxjs/Rx';

// libraries
import { browserHistory } from 'react-router';

// components
import IdeaCard, { Props as IdeaCardProps } from 'components/IdeaCard';
import IdeaButton from './IdeaButton';
import Icon from 'components/UI/Icon';
import Spinner from 'components/UI/Spinner';
import Button from 'components/UI/Button';

// services
import { ideasStream, IIdeas } from 'services/ideas';

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// style
import styled from 'styled-components';
import { media } from 'utils/styleUtils';

const Container = styled.div`
  width: 100%;
`;

const Loading = styled.div`
  width: 100%;
  height: 200px;
  background: #fff;
  border-radius: 6px;
  border: solid 1px #eee;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IdeasList: any = styled.div`
  margin-left: -13px;
  margin-right: -13px;
  display: flex;
  flex-wrap: wrap;
`;

const StyledIdeaCard = styled<IdeaCardProps>(IdeaCard)`
  flex-grow: 0;
  width: calc(100% * (1/3) - 26px);
  margin-left: 13px;
  margin-right: 13px;

  ${media.smallerThanDesktop`
    width: calc(100% * (1/2) - 26px);
  `};

  ${media.smallerThanMinTablet`
    width: 100%;
  `};
`;

const LoadMore = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const LoadMoreButton = styled(Button)``;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding-top: 100px;
  padding-bottom: 100px;
  border-radius: 5px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background: #fff;
`;

const IdeaIcon = styled(Icon)`
  height: 45px;
  fill: #999;
`;

const EmptyMessage = styled.div`
  padding-left: 20px;
  padding-right: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
`;

const EmptyMessageLine = styled.div`
  color: #999;
  font-size: 18px;
  font-weight: 400;
  line-height: 22px;
  text-align: center;
`;

interface IAccumulator {
  pageNumber: number;
  ideas: IIdeas;
  filter: object;
  hasMore: boolean;
}

type Props = {
  filter: { [key: string]: any };
  loadMoreEnabled?: boolean | undefined;
};

type State = {
  ideas: IIdeas | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
};

export default class IdeaCards extends React.PureComponent<Props, State> {
  filter$: Rx.BehaviorSubject<object>;
  loadMore$: Rx.BehaviorSubject<boolean>;
  subscriptions: Rx.Subscription[];

  static defaultProps: Partial<Props> = {
    loadMoreEnabled: true
  };

  constructor(props: Props) {
    super(props as any);
    this.state = {
      ideas: null,
      hasMore: false,
      loading: true,
      loadingMore: false
    };
    this.subscriptions = [];
  }

  componentDidMount() {
    this.filter$ = new Rx.BehaviorSubject(this.props.filter);
    this.loadMore$ = new Rx.BehaviorSubject(false);

    const filter$ = this.filter$.map((filter) => {
      return (isObject(filter) && !isEmpty(filter) ? filter : {});
    }).distinctUntilChanged((x, y) => {
      return isEqual(x, y);
    });

    const loadMore$ = this.loadMore$;

    this.subscriptions = [
      Rx.Observable.combineLatest(
        filter$,
        loadMore$,
        (filter, loadMore) => ({ filter, loadMore })
      ).mergeScan<{ filter: object, loadMore: boolean }, IAccumulator>((acc, { filter, loadMore }) => {
        const hasFilterChanged = (!isEqual(acc.filter, filter) || !loadMore);
        const pageNumber = (hasFilterChanged ? 1 : acc.pageNumber + 1);

        this.setState({ loading: hasFilterChanged, loadingMore: !hasFilterChanged });

        return ideasStream({
          queryParameters: {
            'page[size]': 15,
            sort: 'new',
            ...filter,
            'page[number]': pageNumber
          }
        }).observable.map((ideas) => ({
          pageNumber,
          filter,
          ideas: (hasFilterChanged ? ideas : { data: [...acc.ideas.data, ...ideas.data] }) as IIdeas,
          hasMore: has(ideas, 'links.next')
        }));
      }, {
          ideas: {} as IIdeas,
          filter: {},
          pageNumber: 1,
          hasMore: false
        }).subscribe(({ ideas, hasMore }) => {
          this.setState({ ideas, hasMore, loading: false, loadingMore: false });
        })
    ];
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  componentDidUpdate() {
    this.filter$.next(this.props.filter);
  }

  loadMoreIdeas = () => {
    this.loadMore$.next(true);
  }

  goToAddIdeaPage = () => {
    browserHistory.push('/ideas/new');
  }

  filteredByProjectId = () => {
    return this.props.filter.project;
  }

  render() {
    const { ideas, hasMore, loading, loadingMore } = this.state;
    const { loadMoreEnabled } = this.props;
    const showLoadmore = (!!loadMoreEnabled && hasMore);
    const hasIdeas = (ideas !== null && ideas.data.length > 0);

    const loadingIndicator = (loading ? (
      <Loading id="ideas-loading">
        <Spinner size="30px" color="#666" />
      </Loading>
    ) : null);

    const loadMore = ((!loading && hasIdeas && showLoadmore) ? (
      <LoadMore>
        <LoadMoreButton
          text={<FormattedMessage {...messages.loadMore} />}
          processing={loadingMore}
          style="primary"
          size="2"
          onClick={this.loadMoreIdeas}
          circularCorners={false}
        />
      </LoadMore>
    ) : null);

    const empty = ((!loading && !hasIdeas) ? (
      <EmptyContainer id="ideas-empty">
        <IdeaIcon name="idea" />
        <EmptyMessage>
          <EmptyMessageLine>
            <FormattedMessage {...messages.noIdea} />
          </EmptyMessageLine>
        </EmptyMessage>
        <IdeaButton
          projectId={this.props.filter.project}
          phaseId={this.props.filter.phase}
        />
      </EmptyContainer>
    ) : null);

    const ideasList = ((!loading && hasIdeas && ideas) ? (
      <>
        <IdeasList id="e2e-ideas-list">
          {ideas.data.map((idea) => (
            <StyledIdeaCard ideaId={idea.id} key={idea.id} />
          ))}
        </IdeasList>
      </>
    ) : null);

    return (
      <Container id="e2e-ideas-container">
        {loadingIndicator}
        {empty}
        {ideasList}
        {loadMore}
      </Container>
    );
  }
}
