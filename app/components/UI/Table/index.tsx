import React from 'react';
import styled from 'styled-components';
import { fontSizes, colors } from 'utils/styleUtils';

const StyledTable: any = styled.table`
  width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  border-spacing: 0;
  border-collapse: collapse;

  th, td {
    padding: 0;
    margin: 0;
  }

  thead {
    tr {
      th {
        fill: ${colors.label};
        color: ${colors.label};
        font-size: ${fontSizes.small}px;
        font-weight: 600;
        text-align: left;
        text-transform: uppercase;
        line-height: 20px;
        padding-top: 0px;
        padding-bottom: 10px;

        div {
          display: flex;
          align-items: center;
        }

        &.sortable {
          cursor: pointer;

          &:hover,
          &.active {
            fill: #000;
            color: #000;
          }
        }
      }
    }
  }

  tbody {
    tr {
      border-radius: ${(props: any) => props.theme.borderRadius};

      td {
        color: ${colors.adminTextColor};
        font-size: ${fontSizes.small}px;
        font-weight: 400;
        line-height: 20px;
        text-align: left;
        padding-top: 6px;
        padding-bottom: 6px;

        &.center {
          justify-content: center;
        }
      }

      &:hover {
        background: ${colors.background};
        color: #999;
      }
    }
  }

  tfoot {
    display: flex;

    tr {
      display: flex;

      td {
        display: flex;
      }
    }
  }
`;

interface Props {}

interface State {}

export default class Table extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { children } = this.props;
    const className = this.props['className'];

    return (
      <StyledTable cellspacing="0" cellpadding="0" className={className}>{children}</StyledTable>
    );
  }
}
