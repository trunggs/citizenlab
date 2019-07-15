import React from 'react';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { uniq, get } from 'lodash-es';
import { findDOMNode } from 'react-dom';
import { DragSource } from 'react-dnd';

// services
import { IInitiativeData, updateInitiative, initiativeByIdStream } from 'services/initiatives';
import { IInitiativeStatusData } from 'services/initiativeStatuses';

// components
import { Table, Icon } from 'semantic-ui-react';
import WrappedRow from './WrappedRow';
import T from 'components/T';

import Checkbox from 'components/UI/Checkbox';

// utils
import localize, { InjectedLocalized } from 'utils/localize';

// i18n
import { FormattedRelative, InjectedIntlProps } from 'react-intl';
import { injectIntl } from 'utils/cl-intl';

// style
import AssigneeSelect from './AssigneeSelect';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from '../../tracks';
import { TFilterMenu, ManagerType } from '../..';
import { TitleLink, StyledRow } from './Row';
import SubRow from './SubRow';

type InputProps = {
  type: ManagerType;
  initiative: IInitiativeData,
  statuses?: IInitiativeStatusData[],
  selection: Set<string>,
  activeFilterMenu: TFilterMenu;
  className?: string;
  onClickRow: (event) => void;
  onClickCheckbox: (event) => void;
  onClickTitle: (event) => void;
  nothingHappens: (event) => void;
};

type Props = InputProps & {
  connectDragSource: any;
};

class InitiativeRow extends React.PureComponent<Props & InjectedIntlProps & InjectedLocalized> {
  onUpdateInitiativePhases = (selectedPhases) => {
    updateInitiative(this.props.initiative.id, {
      phase_ids: selectedPhases,
    });
  }

  onUpdateInitiativeTopics = (selectedTopics) => {
    updateInitiative(this.props.initiative.id, {
      topic_ids: selectedTopics,
    });
  }

  onUpdateInitiativeStatus = (statusId) => {
    const { initiative } = this.props;
    const initiativeId = initiative.id;

    updateInitiative(initiativeId, {
      initiative_status_id: statusId,
    });

    trackEventByName(tracks.initiativeStatusChange, {
      location: 'Initiative overview',
      method: 'Clicked on the squares representing the statuses',
      initiative: initiativeId
    });
  }

  onUpdateInitiativeAssignee = (assigneeId) => {
    const { initiative } = this.props;
    const initiativeId = initiative.id;

    updateInitiative(initiativeId, {
      assignee_id: assigneeId,
    });

    trackEventByName(tracks.changePostAssignment, {
      location: 'Initiative Manager',
      method: 'Changed through the dropdown in the table overview',
      initiative: initiativeId
    });
  }

  render() {
    const {
      initiative,
      selection,
      connectDragSource,
      activeFilterMenu,
      statuses,
      className,
      onClickRow,
      onClickCheckbox,
      onClickTitle,
      nothingHappens
    } = this.props;

    const selectedStatus: string | undefined = get(initiative, 'relationships.initiative_status.data.id');
    const selectedTopics = initiative.relationships.topics.data.map((p) => p.id);
    const attrs = initiative.attributes;
    const active = selection.has(initiative.id);
    const assigneeId = get(initiative, 'relationships.assignee.data.id');

    return (
      <>
        <WrappedRow
          className={className}
          as={StyledRow}
          active={active}
          onClick={onClickRow}
          ref={(instance) => { instance && connectDragSource(findDOMNode(instance)); }}
        >
          <Table.Cell collapsing={true}>
            <Checkbox value={!!active} onChange={onClickCheckbox} size="17px" />
          </Table.Cell>
          <Table.Cell>
            <TitleLink className="e2e-initiative-manager-initiative-title" onClick={onClickTitle}>
              <T value={attrs.title_multiloc} />
            </TitleLink>
          </Table.Cell>
          <Table.Cell onClick={nothingHappens} singleLine>
            <AssigneeSelect
              onAssigneeChange={this.onUpdateInitiativeAssignee}
              assigneeId={assigneeId}
            />
          </Table.Cell>
          <Table.Cell>
            <FormattedRelative value={attrs.published_at} />
          </Table.Cell>
          <Table.Cell singleLine>
            <Icon name="thumbs up" />
            {attrs.upvotes_count}
          </Table.Cell>
        </WrappedRow>
        <SubRow
          {...{
            active,
            onClickRow,
            className,
            activeFilterMenu,
            selectedTopics,
            statuses,
            selectedStatus
          }}
          onUpdatePhases={this.onUpdateInitiativePhases}
          onUpdateTopics={this.onUpdateInitiativeTopics}
          onUpdateStatus={this.onUpdateInitiativeStatus}
        />
      </>
    );
  }
}

const initiativeSource = {
  beginDrag(props: Props) {
    return {
      type: 'initiative',
      id: props.initiative.id,
    };
  },
  endDrag(props: Props & InjectedIntlProps & InjectedLocalized, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    const { selection } = props;

    if (dropResult && dropResult.type === 'status') {
      selection.has(item.id) && selection.forEach((initiativeId) => {
        updateInitiative(initiativeId, {
          initiative_status_id: dropResult.id,
        });
      });

      !selection.has(item.id) &&
        updateInitiative(item.id, {
          initiative_status_id: dropResult.id,
        });

      trackEventByName(tracks.initiativeStatusChange, {
        location: 'Initiative overview',
        method: 'Dragged and dropped initiative(s) in manager',
      });
    } else if (dropResult && dropResult.type) {

      const observables = selection.has(item.id)
        ? [...selection].map((id) => initiativeByIdStream(id).observable)
        : [initiativeByIdStream(item.id).observable];

      if (dropResult.type === 'topic') {
        combineLatest(observables).pipe(take(1)).subscribe((initiatives) => {
          initiatives.map((initiative) => {
            const currentTopics = initiative.data.relationships.topics.data.map((d) => d.id);
            const newTopics = uniq(currentTopics.concat(dropResult.id));
            updateInitiative(initiative.data.id, {
              topic_ids: newTopics,
            });
          });
        });
      }

    }
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

export default injectIntl<InputProps>(localize<InputProps & InjectedIntlProps>(DragSource('IDEA', initiativeSource, collect)(InitiativeRow)));
