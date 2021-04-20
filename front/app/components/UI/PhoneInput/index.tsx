import React, { ReactElement } from 'react';
import { createGlobalStyle } from 'styled-components';
import ReactPhoneInput from 'react-phone-input-2';
import { defaultInputStyle } from 'utils/styleUtils';
import { defaultStyles } from 'utils/styleUtils';
import 'react-phone-input-2/lib/style.css';

const PhoneStyle = createGlobalStyle`
  .phone-input {
    font-family: inherit;
    width: 100%;

    &:focus-within {
      .form-control, .flag-dropdown {
        border-color: #000;
      }
    }

    &__input.form-control {
      height: auto !important;
      line-height: inherit !important;
      padding-left: 50px !important;
      width: 100%;
      ${defaultInputStyle}
    }

    .flag-dropdown {
      ${defaultInputStyle}
      padding-left: 4px !important;
      padding-right: 4px !important;
      border-right: none !important;
      border-top-right-radius: 0px !important;
      border-bottom-right-radius: 0px !important;
    }

    .country-list {
      box-shadow: ${defaultStyles.boxShadow};
    }

    li.country {
      text-decoration: none;
      padding: 10px !important;
      margin-bottom: 4px;
      background: transparent;
      border-radius: ${(props: any) => props.theme.borderRadius};

      &:hover,
      &:focus {
        color: #000;
        text-decoration: none;
      }
    }
  }
`;

interface Props {
  number: string | null;
  countryCode: string | null;
  defaultCountryCode: string;
  onChange: ({
    countryCode,
    number,
  }: {
    countryCode: string;
    number: string;
  }) => void;
}

export default function PhoneInput({
  number,
  countryCode,
  onChange,
  defaultCountryCode,
}: Props): ReactElement {
  function handleChange(fullNumber, country, _e, _formattedValue) {
    onChange({ countryCode: country.countryCode, number: fullNumber });
  }

  return (
    <>
      <PhoneStyle />
      <ReactPhoneInput
        country={countryCode || defaultCountryCode}
        value={number}
        onChange={handleChange}
        inputClass="phone-input__input"
        containerClass="phone-input"
      />
    </>
  );
}
