import { PureComponent } from 'react';
import { Subscription } from 'rxjs';
import { IPermissionData, phasePermissions } from 'services/participationContextPermissions';
import { isNilOrError } from 'utils/helperUtils';

interface InputProps {
  projectId: string;
  phaseId: string;
}

type children = (renderProps: GetPhasePermissionsChildProps) => JSX.Element | null;

interface Props extends InputProps {
  children?: children;
}

interface State {
  permissions: IPermissionData[] | undefined | null | Error;
}

export type GetPhasePermissionsChildProps = IPermissionData[] | undefined | null | Error;

export default class GetPhasePermissions extends PureComponent<Props, State> {
  private subscriptions: Subscription[];

  constructor(props: Props) {
    super(props);
    this.state = {
      permissions: undefined
    };
  }

  componentDidMount() {
    const { projectId, phaseId } = this.props;
    this.subscriptions = [
      phasePermissions(projectId, phaseId).observable.subscribe(permissions => this.setState({ permissions: !isNilOrError(permissions) ? permissions.data : permissions }))
    ];
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  render() {
    const { children } = this.props;
    const { permissions } = this.state;
    return (children as children)(permissions);
  }
}
