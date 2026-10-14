'use client';

import { SIGN_IN } from '@/copy/sign-in';

import { DocumentTitle } from '../document-title';

/**
 * What the `(auth)` route files render (Appendix F §3.8: route files import features only): the
 * frame, the card, the navigation they are given, and the tab's title ("Sign in · XR Learning
 * Platform").
 */
export { AuthFrame } from './auth-frame';
export { SignIn } from './sign-in';
export { type AppNavigation, NavigationProvider } from '@/nav/navigation';

export function SignInTitle() {
  return <DocumentTitle title={SIGN_IN.title} />;
}
