// The bundled tsx runner expects process.geteuid; providing it avoids a Windows
// os.userInfo() failure in the constrained test host.
if (typeof process.geteuid !== 'function') process.geteuid = () => 0;
