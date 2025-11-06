import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401);
    return next(new Error('Unauthorized'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, provider }
    return next();
  } catch (err) {
    res.status(401);
    return next(new Error('Invalid token'));
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Unauthorized'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    return next();
  };
}

// Enforce that students must be authenticated via Microsoft OAuth
export function requireMicrosoftForStudent(req, res, next) {
  try {
    if (req.user?.role === 'student' && req.user?.provider !== 'microsoft') {
      res.status(401);
      throw new Error('Student access requires Microsoft login');
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
