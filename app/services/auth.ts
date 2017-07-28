import { IUser } from 'services/users';
import { IHttpMethod } from 'typings.d';
import { API_PATH } from 'containers/App/constants';
import { getJwt, setJwt } from 'utils/auth/jwt';
import * as _ from 'lodash';
import request from 'utils/request';
import streams from 'utils/streams';

export function signIn(email: string, password: string) {
  const bodyData = {
    auth: { email, password }
  };

  const httpMethod: IHttpMethod = {
    method: 'POST',
  };

  return request<any>(`${API_PATH}/user_token`, bodyData, httpMethod, null).then((data) => {
    const jwt = getJwt();

    if (!jwt && _.has(data, 'jwt')) {
      setJwt(data.jwt);
    }

    return data;
  }).catch((error) => {
    throw error;
  });
}

export function signUp(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  selectedGender: 'male' | 'female' | 'unspecified' | null = null,
  selectedYearOfBirth: number | null = null,
  selectedAreaId: string | null = null
) {
  const bodyData = {
    user: {
      firstName,
      lastName,
      email,
      password,
      selectedGender,
      selectedYearOfBirth,
      selectedAreaId
    }
  };

  const httpMethod: IHttpMethod = {
    method: 'POST'
  };

  return request(`${API_PATH}/users`, bodyData, httpMethod, null).then(() => {
    return { email, password };
  }).catch((error) => {
    throw error;
  });
}

export function observeCurrentUser() {
  return streams.create<IUser>({ apiEndpoint: `${API_PATH}/users/me` });
}

export function getAuthUser(): Promise<IUser> {
  return request(`${API_PATH}/users/me`, null, null, null).then((response: IUser) => {
    if (response && _.has(response, 'data.id')) {
      return response;
    } else {
      throw new Error('not authenticated');
    }
  }).catch((error) => {
    throw new Error('not authenticated');
  });
}
