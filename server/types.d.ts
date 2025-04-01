import session from 'express-session';
import { Store } from 'express-session';

declare module 'express-session' {
  interface SessionStore extends Store {}
}