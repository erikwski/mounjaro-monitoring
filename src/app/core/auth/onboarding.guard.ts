import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, map, take } from 'rxjs';
import { AuthService } from './auth.service';
import { UserService } from '../../shared/services/user.service';

export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  return toObservable(auth.user).pipe(
    filter((user) => user !== undefined && user !== null),
    take(1),
    switchMap((user) => userService.getProfile(user!.uid)),
    take(1),
    map((profile) =>
      profile?.onboardingComplete ? true : router.createUrlTree(['/onboarding']),
    ),
  );
};
