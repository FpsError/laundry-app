# Masbana Laundry App - Startup Guide

## Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```powershell
   python app.py
   ```
   Or use the PowerShell script:
   ```powershell
   .\start.ps1
   ```

   The backend will run on **http://localhost:5000**

## Frontend Setup

1. Navigate to the frontend directory (in a new terminal):
   ```powershell
   cd frontend
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

   The frontend will run on **http://localhost:3000**

## How It Works

- **Backend**: Flask REST API running on port 5000
- **Frontend**: React app with Vite running on port 3000
- **API Proxy**: Vite proxies `/api/*` requests to the backend automatically
- **CORS**: Configured on the backend to allow cross-origin requests

## Testing the Connection

1. Start both backend and frontend servers
2. Open your browser to http://localhost:3000
3. The frontend will automatically connect to the backend API
4. Check the browser console for any connection errors

## API Endpoints

All API endpoints are prefixed with `/api`:
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/bookings` - Booking management
- `/api/admin/*` - Admin routes
- `/api/attendant/*` - Attendant routes
- `/api/waitlist/*` - Waitlist management

See `backend/API_DOCUMENTATION.md` for full API documentation.

## Troubleshooting

### Backend won't start
- Ensure all Python dependencies are installed
- Check if port 5000 is already in use
- Verify Python version is 3.8+

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is already in use
- Clear npm cache: `npm cache clean --force`

### API requests failing
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify the proxy configuration in `vite.config.js`
