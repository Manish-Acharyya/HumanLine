export function sanitizeUser(user) {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

export function sanitizeEmployee(employee) {
  const obj = typeof employee.toObject === 'function' ? employee.toObject() : { ...employee };
  if (obj.user && typeof obj.user === 'object' && !Array.isArray(obj.user)) {
    obj.user = sanitizeUser(obj.user);
  }
  return obj;
}
