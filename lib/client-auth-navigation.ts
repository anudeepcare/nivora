let redirectingToLogin=false;
/** Auth listeners and the account menu can observe the same sign-out event. */
export function navigateToLogin(){
 if(redirectingToLogin||window.location.pathname==='/login')return;
 redirectingToLogin=true;
 window.location.replace('/login');
}
