// Add configuration for Socket.IO in production
module.exports = {
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: '/api/socket/:path*',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
};
