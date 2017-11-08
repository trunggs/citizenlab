// Libraries
import * as React from 'react';
import * as Rx from 'rxjs/Rx';
import * as _ from 'lodash';
import { injectTFunc } from 'components/T/utils';
import { injectIntl, intlShape, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { browserHistory } from 'react-router';
import { API, IOption, IRelationship } from 'typings.d';

// i18n
import { getLocalized } from 'utils/i18n';
import messages from '../messages';

// Store
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { makeSelectSetting } from 'utils/tenant/selectors';
import { makeSelectLocale } from 'containers/LanguageProvider/selectors';

// Services
import {
  IUpdatedProjectProperties,
  IProject,
  IProjectData,
  projectBySlugStream,
  addProject,
  updateProject,
} from 'services/projects';
import {
  IProjectImageData,
  projectImagesStream,
  addProjectImage,
  deleteProjectImage
} from 'services/projectImages';
import { areasStream, IAreaData } from 'services/areas';
import { localeStream } from 'services/locale';
import { currentTenantStream, ITenant } from 'services/tenant';

// utils
import { getBase64 } from 'utils/imageTools';

// Components
import Input from 'components/UI/Input';
import Upload from 'components/UI/Upload';
import Button from 'components/UI/Button';
import Error from 'components/UI/Error';
import Radio from 'components/UI/Radio';
import MultipleSelect from 'components/UI/MultipleSelect';
import FieldWrapper from 'components/admin/FieldWrapper';
import SubmitWrapper from 'components/admin/SubmitWrapper';

// Style
const FormWrapper = styled.form`
  img {
    max-width: 100%;
  }
`;

const ProjectImages = styled.div`
  display: flex;
`;

const ImageWrapper = styled.div`
  margin: .5rem;
  position: relative;

  &:first-child{
    margin-left: 0;
  }
`;

const DeleteButton = styled.button`
  background: rgba(0, 0, 0, .5);
  border-radius: 50%;
  color: black;
  right: -.5rem;
  position: absolute;
  top: -.5rem;
  z-index: 1;
`;

const SaveButton = styled.button`
  background: #d60065;
  border-radius: 5px;
  color: white;
  font-size: 1.25rem;
  padding: 1rem 2rem;
`;

// Component typing
type Props = {
  intl: ReactIntl.InjectedIntl,
  lang: string,
  params: {
    slug: string | null,
  },
  userLocale: string,
  tFunc: Function
};

interface State {
  loading: boolean;
  projectData: IProjectData | { id: null, attributes: {}, relationships: { areas: {data} }};
  uploadedImages: any;
  uploadedHeader: string | null;
  projectImages: IProjectImageData[];
  projectAttributesDiff: IUpdatedProjectProperties;
  errors: {
    [fieldName: string]: API.Error[]
  };
  saved: boolean;
  areas: IAreaData[];
  areaType: 'all' | 'selection';
  locale: string | null;
  currentTenant: ITenant | null;
  areasOptions: IOption[];
}

class AdminProjectEditGeneral extends React.PureComponent<Props, State> {
  subscriptions: Rx.Subscription[] = [];

  constructor() {
    super();

    this.state = {
      loading: false,
      projectData: { id: null, attributes: {}, relationships: { areas: { data: [] } } },
      uploadedImages: [],
      uploadedHeader: null,
      projectImages: [],
      projectAttributesDiff: {},
      errors: {},
      saved: false,
      areas: [],
      areaType: 'all',
      locale: null,
      currentTenant: null,
      areasOptions: [],
    };
  }

  getSubmitState = (): 'disabled' | 'enabled' | 'error' | 'success' => {
    if (!_.isEmpty(this.state.errors)) {
      return 'error';
    }
    if (this.state.saved && _.isEmpty(this.state.projectAttributesDiff)) {
      return 'success';
    }
    return _.isEmpty(this.state.projectAttributesDiff) ? 'disabled' : 'enabled';
  }

  updateProjectSubscription = (slug) => {
    const { userLocale } = this.props;

    this.subscriptions[0] = projectBySlugStream(slug).observable.switchMap((project) => {
      return projectImagesStream(project.data.id).observable.map((images) => ({
        projectData: project.data,
        projectImages: images.data,
      }));
    }).subscribe(({ projectData, projectImages }) => {
      this.setState({
        projectData,
        projectImages,
        uploadedHeader: null,
        uploadedImages: [],
        loading: false,
        projectAttributesDiff: {},
        areaType: projectData.relationships.areas.data.length > 0 ? 'selection' : 'all',
      });
    });
  }

  componentDidMount() {
    if (this.props.params.slug) {
      this.updateProjectSubscription(this.props.params.slug);
    }

    this.subscriptions.push(
      Rx.Observable.combineLatest(
        localeStream().observable,
        currentTenantStream().observable,
        areasStream().observable,
      )
      .subscribe(([locale, currentTenant, areas]) => {
        this.setState({
          locale,
          currentTenant,
          areas: areas.data,
          areasOptions: areas.data.map((area) => ({
            value: area.id,
            label: getLocalized(area.attributes.title_multiloc, locale, currentTenant.data.attributes.settings.core.locales)
          }))
        });
      })
    );

  }

  componentWillUnmount() {
    _(this.subscriptions).forEach(subscription => subscription.unsubscribe());
  }

  componentWillReceiveProps(newProps) {
    // Update subscription if the slug changes
    // This happens when transitioning from New to Edit view after saving a new project
    if (newProps.params.slug && newProps.params.slug !== this.props.params.slug) {
      this.updateProjectSubscription(newProps.params.slug);
    }
  }

  setRef = (element) => {

  }

  changeTitle = (value: string): void => {
    const newVal = _.set({}, `projectAttributesDiff.title_multiloc.${this.props.userLocale}`, value);
    this.setState(_.merge({}, this.state, newVal));
  }

  handleHeaderUpload = async (image) => {
    const attrsDiff = _.cloneDeep(this.state.projectAttributesDiff);
    const base64 = await getBase64(image) as string;
    this.setState({ uploadedHeader: base64, projectAttributesDiff: { ...attrsDiff, header_bg: base64 } });
  }

  handleUploadOnRemove = () => {

  }

  handleProjectImageUpload = async (image) => {
    const { projectData, projectImages } = this.state;
    const base64 = await getBase64(image) as string;
    if (projectData) {
      addProjectImage(projectData.id, base64).then((response: any) => {
        projectImages.push(response.data);
        this.setState({ projectImages });
      });
    }
  }

  deletePicture = (event) => {
    const { projectData } = this.state;

    if (projectData) {
      const imageId = event.target.dataset.imageId;
      const projectId = projectData.id;

      deleteProjectImage(projectId, imageId).then(() => {
        this.setState({ projectImages: _.reject(this.state.projectImages, { id: imageId }) });
      });
    }
  }

  handleAreaTypeChange = (value) => {
    const newState = { areaType: value } as State;

    // Clear the array of areas ids if you select "all areas"
    if (value === 'all') {
      const newDiff = _.cloneDeep(this.state.projectAttributesDiff);
      newDiff.area_ids = [];

      newState.projectAttributesDiff = newDiff;
    }

    this.setState(newState);
  }

  handleAreaSelectionChange = (values: IOption[]) => {
    const newDiff = _.cloneDeep(this.state.projectAttributesDiff);
    newDiff.area_ids = values.map((value) => (value.value));

    this.setState({ projectAttributesDiff: newDiff });
  }

  handleSaveErrors = (errors) => {
    this.setState({ errors: errors.json.errors });
  }

  saveProject = (event) => {
    event.preventDefault();
    const { projectAttributesDiff } = this.state;

    if (!_.isEmpty(projectAttributesDiff) && this.state.projectData.id) {
      this.setState({ loading: true, saved: true });
      updateProject(this.state.projectData.id, projectAttributesDiff)
      .catch(this.handleSaveErrors)
      .then(() => {
        this.setState({ loading: false, saved: true });
      });
    } else if (!_.isEmpty(projectAttributesDiff)) {
      this.setState({ loading: true, saved: true });

      addProject(projectAttributesDiff).then((project: IProject) => {
        browserHistory.push(`/admin/projects/${project.data.attributes.slug}/edit`);
        this.setState({ loading: false, saved: true });
      }).catch(this.handleSaveErrors);
    }
  }

  render() {
    const { projectData, uploadedImages, uploadedHeader, loading, projectImages, projectAttributesDiff } = this.state;
    const { userLocale, tFunc, intl: { formatMessage } } = this.props;
    const projectAttrs = { ...projectData.attributes, ...projectAttributesDiff } as IUpdatedProjectProperties;
    projectAttrs.area_ids = projectAttrs.area_ids || projectData.relationships.areas.data.map((area) => (area.id));

    const submitState = this.getSubmitState();
    const areasValues = projectAttrs.area_ids ? projectAttrs.area_ids.map((id) => {
      const option = this.state.areasOptions.find(areaOption => areaOption.value === id);

      if (option) {
        return option;
      }

      return null;
    }) : null;

    return (
      <FormWrapper className="e2e-project-general-form" onSubmit={this.saveProject}>
        <FieldWrapper>
          <label htmlFor="project-title">
            <FormattedMessage {...messages.titleLabel} />
          </label>
          <Input
            id="project-title"
            type="text"
            placeholder=""
            value={tFunc(projectAttrs.title_multiloc)}
            error=""
            onChange={this.changeTitle}
            setRef={this.setRef}
          />
          <Error fieldName="title_multiloc" apiErrors={this.state.errors.title_multiloc} />
        </FieldWrapper>

        <FieldWrapper>
          <label htmlFor="project-area">
            <FormattedMessage {...messages.areasLabel} />
          </label>
          <Radio onChange={this.handleAreaTypeChange} currentValue={this.state.areaType} value="all" name="areas" id="areas-all" label={formatMessage(messages.areasAllLabel)} />
          <Radio onChange={this.handleAreaTypeChange} currentValue={this.state.areaType} value="selection" name="areas" id="areas-selection" label={formatMessage(messages.areasSelectionLabel)} />

          {this.state.areaType === 'selection' &&
            <MultipleSelect
              options={this.state.areasOptions}
              value={_.compact(areasValues)}
              onChange={this.handleAreaSelectionChange}
              placeholder=""
              disabled={this.state.areaType !== 'selection'}
            />
          }
        </FieldWrapper>

        <FieldWrapper>
          <label>
            <FormattedMessage {...messages.headerImageLabel} />
          </label>
          {uploadedHeader &&
            <img src={uploadedHeader} alt="" role="presentation" />
          }
          {!uploadedHeader && projectAttrs && projectAttrs.header_bg &&
            <img
              src={typeof projectAttrs.header_bg  === 'string' ? projectAttrs.header_bg : projectAttrs.header_bg.large}
              alt=""
              role="presentation"
            />
          }
          <Upload
            accept="image/jpg, image/jpeg, image/png, image/gif"
            items={uploadedImages}
            onAdd={this.handleHeaderUpload}
            onRemove={this.handleUploadOnRemove}
          />
        </FieldWrapper>

        <FieldWrapper>
          <label>
            <FormattedMessage {...messages.projectImageLabel} />
          </label>
          <ProjectImages>
            {projectImages && projectImages.map((image) => (
              <ImageWrapper key={image.id}>
                <DeleteButton onClick={this.deletePicture} data-image-id={image.id}>🗑️</DeleteButton>
                <img src={image.attributes.versions.small} alt="" role="presentation"/>
              </ImageWrapper>
            ))}
          </ProjectImages>
          <Upload
            accept="image/jpg, image/jpeg, image/png, image/gif"
            items={uploadedImages}
            onAdd={this.handleProjectImageUpload}
            onRemove={this.handleUploadOnRemove}
          />
        </FieldWrapper>

        <SubmitWrapper
          loading={loading}
          status={submitState}
          messages={{
            buttonSave: messages.saveProject,
            buttonError: messages.saveError,
            buttonSuccess: messages.saveSuccess,
            messageError: messages.saveErrorMessage,
            messageSuccess: messages.saveSuccessMessage,
          }}
        />
      </FormWrapper>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  userLocale: makeSelectLocale(),
});

export default ((injectTFunc(injectIntl(connect(mapStateToProps)(AdminProjectEditGeneral))) as any) as typeof AdminProjectEditGeneral);
