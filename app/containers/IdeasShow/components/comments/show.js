/**
*
* Image
*
*/

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import T from 'containers/T';

import { Grid, Segment } from 'semantic-ui-react';

//import IdeaContent from './IdeaContent';

function Comment(props) {
  const { className, commentContent, createdAt, modifiedAt } = props;

  return (
    <div className={className}>
        <T value={commentContent} />
      ... created at: {createdAt}
      ... modified at: {modifiedAt}
      {this.props.children}
    </div>
  );
}

Comment.propTypes = {
  className: PropTypes.string,
  commentContent: PropTypes.object.isRequired,
  createdAt: PropTypes.any,
  modifiedAt: PropTypes.any,
};