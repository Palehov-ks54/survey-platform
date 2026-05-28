const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
    }
};

module.exports = adminMiddleware;