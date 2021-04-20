import { IUser, deleteUser } from 'services/users';
import { IHttpMethod, Locale } from 'typings';
import { API_PATH, AUTH_PATH } from 'containers/App/constants';
import { getJwt, setJwt, removeJwt, decode } from 'utils/auth/jwt';
import { endsWith } from 'utils/helperUtils';
import request from 'utils/request';
import streams from 'utils/streams';
import clHistory from 'utils/cl-router/history';
import { removeLocale } from 'utils/cl-router/updateLocationDescriptor';
import eventEmitter from 'utils/eventEmitter';
export const authApiEndpoint = `${API_PATH}/users/me`;

export interface IUserToken {
  token: string;
}

export function authUserStream() {
  return streams.get<IUser | null>({ apiEndpoint: authApiEndpoint });
}

export interface ILockedField {
  type: 'locked_attribute';
  id: string;
  attributes: {
    name: 'first_name' | 'last_name' | 'email';
  };
}

export function lockedFieldsStream() {
  return streams.get<{ data: ILockedField[] }>({
    apiEndpoint: `${authApiEndpoint}/locked_attributes`,
  });
}

export async function signIn(credentials) {
  try {
    const bodyData = { auth: credentials };
    const httpMethod: IHttpMethod = { method: 'POST' };
    const { token } = await request<IUserToken>(
      `${API_PATH}/user_token`,
      bodyData,
      httpMethod,
      null
    );
    setJwt(token);
    const authUser = await getAuthUserAsync();
    await streams.reset(authUser);
    return authUser;
  } catch (error) {
    signOut();
    throw error;
  }
}

export async function signUp(
  user,
  isInvitation: boolean | null | undefined,
  inviteToken: string | undefined | null
) {
  const httpMethod: IHttpMethod = {
    method: 'POST',
  };

  try {
    const signUpEndpoint =
      isInvitation === true
        ? `${API_PATH}/invites/by_token/${inviteToken}/accept`
        : `${API_PATH}/users`;
    const bodyData = { [inviteToken ? 'invite' : 'user']: user };
    const { token, id } = await request(
      signUpEndpoint,
      bodyData,
      httpMethod,
      null
    );
    setJwt(token);
    return id;
  } catch (error) {
    throw error;
  }
}

export function signOut() {
  const jwt = getJwt();

  if (jwt) {
    const decodedJwt = decode(jwt);

    removeJwt();

    if (decodedJwt.logout_supported) {
      const { provider, sub } = decodedJwt;
      const url = `${AUTH_PATH}/${provider}/logout?user_id=${sub}`;
      window.location.href = url;
    } else {
      streams.reset(null);
      const { pathname } = removeLocale(location.pathname);

      if (
        pathname &&
        (endsWith(pathname, '/sign-up') || pathname.startsWith('/admin'))
      ) {
        clHistory.push('/');
      }
    }
  }
}

export function signOutAndDeleteAccountPart1() {
  setTimeout(() => eventEmitter.emit('tryAndDeleteProfile'), 500);
  clHistory.push('/');
}

export function signOutAndDeleteAccountPart2() {
  return new Promise((resolve, _reject) => {
    const jwt = getJwt();

    if (jwt) {
      const decodedJwt = decode(jwt);

      const { provider, sub } = decodedJwt;

      deleteUser(sub)
        .then((_res) => {
          removeJwt();
          if (decodedJwt.logout_supported) {
            const url = `${AUTH_PATH}/${provider}/logout?user_id=${sub}`;
            window.location.href = url;
          } else {
            streams.reset(null);
          }
          clHistory.push('/');
          resolve(true);
        })
        .catch((_res) => {
          resolve(false);
        });
    }
  });
}

export async function getAuthUserAsync() {
  try {
    const authenticatedUser = await request<IUser>(
      authApiEndpoint,
      null,
      null,
      null
    );
    return authenticatedUser;
  } catch {
    signOut();
    throw new Error('not_authenticated');
  }
}

export async function sendPasswordResetMail(email: string) {
  try {
    const bodyData = {
      user: {
        email,
      },
    };
    const httpMethod: IHttpMethod = { method: 'POST' };
    const response = await request(
      `${API_PATH}/users/reset_password_email`,
      bodyData,
      httpMethod,
      null
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function resetPassword(password: string, token: string) {
  try {
    const bodyData = {
      user: {
        password,
        token,
      },
    };
    const httpMethod: IHttpMethod = { method: 'POST' };
    const response = await request(
      `${API_PATH}/users/reset_password`,
      bodyData,
      httpMethod,
      null
    );
    return response;
  } catch (error) {
    throw error;
  }
}
