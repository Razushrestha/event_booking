function buildAuthUser(user, decoded = {}) {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    _id: decoded._id || user.userId,
    id: user.userId,
  };
}

module.exports = buildAuthUser;
