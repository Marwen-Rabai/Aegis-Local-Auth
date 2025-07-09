# 🛡️ Aegis Local Auth v2.0 - Enterprise SMS Verification Platform

**🚀 NOW WITH ENTERPRISE-GRADE UI & DEPLOYMENT READY!**

A professional self-sovereign phone number verification system with **unlimited mass registration**, **modern web interface**, **Docker deployment**, and **enterprise-grade security**. Complete transformation to production-ready architecture with real-time analytics and scalable infrastructure.

## ⭐ NEW IN V2.0 - ENTERPRISE TRANSFORMATION

- **🎨 MODERN UI**: Complete interface overhaul with Tailwind CSS, dark mode, and professional design
- **📊 REAL-TIME DASHBOARD**: Live statistics, charts, and system monitoring
- **🐳 DOCKER READY**: Production containers with health checks and monitoring
- **🔐 ENTERPRISE SECURITY**: Enhanced headers, rate limiting, input validation, and encryption
- **⚡ PERFORMANCE OPTIMIZED**: Compression, caching, and optimized database queries
- **📈 ADVANCED ANALYTICS**: Chart.js integration with provider performance metrics
- **🧪 COMPREHENSIVE TESTING**: Jest, Supertest, and load testing suites
- **📝 PRODUCTION DOCS**: Complete deployment guides and troubleshooting
- **🔧 ENHANCED CONFIG**: Environment variables and secure configuration management
- **📱 RESPONSIVE DESIGN**: Mobile-first approach with Progressive Web App features

**Developed by:** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Portfolio:** [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

## 🚀 NEW FEATURES

- **✅ UNLIMITED REGISTRATION**: No limits on phone number registrations
- **📱 MASS REGISTRATION**: Register up to 10,000 phone numbers at once
- **📊 REAL-TIME STATISTICS**: Live progress tracking and comprehensive analytics
- **🔧 FIXED DEPENDENCIES**: Resolved all installation issues with modern serialport
- **📈 DETAILED LOGGING**: Enhanced logging with phone number success tracking
- **⚡ PROGRESS TRACKING**: Real-time progress bars and success/failure counts
- **🔀 MODULAR SMS SYSTEM**: Multiple SMS providers with automatic failover
- **📱 ANDROID GATEWAY**: Send SMS via Android app over Wi-Fi
- **🌐 API INTEGRATION**: Support for external SMS API providers

## Prerequisites

- Node.js 16+ (Tested on Node.js 22.16.0)
- **SMS Provider (Choose one or multiple):**
  - Physical GSM/LTE modem (e.g., Huawei E3372) with active SIM card
  - Android phone with SMS Gateway app
  - SMS API service (Twilio, etc.)
- USB port for modem connection (if using modem)
- Wi-Fi network (if using Android gateway)

## 🔧 FIXED Installation

**The dependency issues have been resolved!** Use our installation script:

```bash
# Method 1: Use our fixed installation script (RECOMMENDED)
node install.js

# Method 2: Manual installation (if needed)
npm run install-deps
```

### 🪟 Windows Users
For Windows-specific installation and PowerShell commands, see [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)

### If you still encounter issues:

```bash
# Clean installation
npm cache clean --force

# Linux/macOS
rm -rf node_modules package-lock.json

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# Then reinstall
node install.js
```

## Configuration

Edit `config/config.js` to configure your SMS providers:

```javascript
// Choose your primary SMS provider
SMS_PROVIDER: 'api',           // 'api', 'gateway', or 'modem'
SMS_FALLBACK_ENABLED: true,    // Enable automatic failover

// GSM Modem Configuration
SERIAL_PORT_PATH: 'COM5',      // Windows: COM3, Linux: /dev/ttyUSB0, macOS: /dev/tty.usbmodem*

// SMS API Configuration
SMS_API_CONFIG: {
  apiKey: 'your-api-key-here',
  url: 'https://api.sms-provider.com/send'
},

// Android Gateway Configuration
SMS_GATEWAY_CONFIG: {
  url: 'http://192.168.1.140:8090/send'  // Your Android phone's IP
}
```

## Running the Application

```bash
# Verify installation first
npm run check

# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

Access the application at: **http://localhost:3000**

## 🌟 Core Features

### Modular SMS System
- **Multiple SMS Providers**: API, Android Gateway, GSM Modem
- **Automatic Failover**: Seamless switching between providers
- **Smart Routing**: Intelligent provider selection
- **Real-time Status**: Live monitoring of all providers

### Single Registration
- **Unlimited phone number registration**
- Real-time OTP delivery via multiple providers
- Enhanced success/failure tracking
- Detailed SMS delivery statistics

### Mass Registration
- **Register up to 10,000 phone numbers simultaneously**
- Real-time progress tracking with live updates
- Batch processing with configurable delays
- Comprehensive success/failure reporting
- Estimated completion times

### Advanced Statistics
- **Real-time system performance metrics**
- SMS delivery success rates
- Provider health monitoring with signal strength
- User registration statistics
- Daily/weekly performance reports

### Enhanced Security
- Phone numbers and OTPs hashed before storage
- Rate limiting with increased limits for mass operations
- Account locking after failed attempts (verification only)
- Comprehensive audit logging
- **No registration limits** - truly unlimited

## 🎯 API Endpoints

### Single Registration
- `POST /api/register` - Send OTP to phone number (unlimited)
- `POST /api/verify` - Verify OTP code

### Mass Registration
- `POST /api/mass-register` - Start mass registration operation
- `GET /api/mass-register/{operationId}` - Check operation status

### Statistics & Monitoring
- `GET /api/statistics` - Comprehensive system statistics
- `GET /api/health` - Enhanced health check
- `GET /api/status` - Basic service status
- `GET /api/modem-info` - Detailed modem information

### SMS Provider Management
- **API SMS**: External SMS service integration
- **Android Gateway**: `POST /send` via Android app
- **GSM Modem**: Direct hardware communication

## 📊 Mass Registration Example

### Via API:
```javascript
// Register multiple numbers
POST /api/mass-register
{
  "phoneNumbers": [
    "+1234567890",
    "+1987654321", 
    "+44123456789",
    // ... up to 10,000 numbers
  ]
}

// Response includes operation ID for tracking
{
  "success": true,
  "operationId": "op_1640123456789_abc123",
  "validNumbers": 1000,
  "estimatedDuration": "34 minutes"
}

// Track progress
GET /api/mass-register/op_1640123456789_abc123
{
  "operation": {
    "progress": "45.2%",
    "processed": 452,
    "successful": 445,
    "failed": 7
  }
}
```

### Via Web Interface:
1. Go to **Mass Registration** tab
2. Paste phone numbers (one per line)
3. Click **Start Mass Registration**
4. Watch real-time progress with live updates

## 📈 Enhanced Statistics

### System Overview
- **Total SMS Sent**: Real-time counter
- **Success Rate**: Live percentage
- **Verified Users**: Total verified count
- **Modem Status**: Health with signal strength

### Performance Metrics
- Average response time per SMS
- Daily/weekly success rates
- Peak usage statistics
- Error rate analysis

### Real-time Monitoring
- Active operations counter
- Live progress tracking
- Recent results feed
- System resource usage

## 🔧 Configuration Options

### SMS Provider Settings
```javascript
// config/config.js
SMS_PROVIDER: 'api',           // Primary provider: 'api', 'gateway', 'modem'
SMS_FALLBACK_ENABLED: true,    // Enable automatic failover

// Mass Registration Settings
BULK_SMS_DELAY: 2000,        // Delay between SMS (ms)
MAX_BULK_SIZE: 10000,        // Max numbers per operation
BULK_BATCH_SIZE: 100,        // Process in batches

// Rate limits (increased for mass operations)
RATE_LIMIT: {
  REGISTRATION: { max: 1000 }, // 1000 per 15 min
  BULK_SMS: { max: 10 },       // 10 operations per hour
  STATISTICS: { max: 60 }      // 60 requests per minute
}
```

## 📋 Troubleshooting

### 🪟 Windows PowerShell Users
See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for Windows-specific commands and troubleshooting.

### Common Issues SOLVED:

#### ✅ "node-pre-gyp" errors
**FIXED** - Our installation script uses modern serialport

#### ✅ "gsm-modem" dependency issues  
**FIXED** - Replaced with direct serialport implementation

#### ✅ "SMS Provider Issues"
**FIXED** - Modular SMS system with automatic failover

### SMS Provider Troubleshooting:

#### Android Gateway Issues:
```bash
# Check if Android app is running
ping 192.168.1.140

# Test manual SMS send
curl -X POST http://192.168.1.140:8090/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "message": "Test"}'
```

#### GSM Modem Issues:
```bash
# Check modem connection (Windows)
# Device Manager → Ports → Check COM port

# Test modem manually (Linux)
sudo dmesg | grep tty
ls /dev/ttyUSB*

# Test AT commands
echo "AT" > /dev/ttyUSB0
```

#### API SMS Issues:
```bash
# Test API endpoint
curl -X POST https://api.sms-provider.com/send \
  -H "Authorization: Bearer your-api-key" \
  -d '{"to": "+1234567890", "text": "Test"}'
```

#### ✅ Missing parser modules
**FIXED** - Automatically installs @serialport/parser-readline

### GSM Modem Issues:

```bash
# Check modem connection
GET /api/modem-info

# Test modem manually (Windows)
# Use Device Manager → Ports to find COM port

# Test modem manually (Linux)
sudo dmesg | grep tty
ls /dev/ttyUSB*
```

### System Health:

```bash
# Check all systems
GET /api/health

# View detailed statistics  
GET /api/statistics

# Check logs
tail -f logs/access.log
tail -f logs/error.log
```

## 🎯 Use Cases

### Small Scale (1-100 numbers)
- Customer verification
- Two-factor authentication
- Account registration

### Medium Scale (100-1,000 numbers)
- Marketing campaigns
- User onboarding
- Event notifications

### Large Scale (1,000-10,000 numbers)
- Mass user migration
- Emergency notifications
- Large-scale verification

## 📊 Performance

- **Single SMS**: ~2-5 seconds
- **Batch Processing**: 2 seconds between SMS (configurable)
- **10,000 numbers**: ~5-6 hours (with 2s delay)
- **Success Rate**: Typically 95%+ with good signal

## 🔐 Security Features

- **Unlimited Registration**: No account locking on registration
- **Enhanced Privacy**: Phone numbers hashed before storage
- **Audit Trail**: Comprehensive logging of all operations
- **Rate Protection**: Smart rate limiting for abuse prevention
- **Local Data**: Complete data sovereignty

## 📱 Modern Interface

- **Tabbed Interface**: Single, Mass, Statistics
- **Real-time Updates**: Live progress tracking
- **Responsive Design**: Works on all devices
- **Professional UI**: Clean, modern design
- **Progress Indicators**: Visual feedback for all operations

## 🚀 Quick Start

```bash
# 1. Install (fixed dependencies)
node install.js

# 2. Configure SMS provider in config/config.js
# Choose: 'api', 'gateway', or 'modem'

# 3. Set up your chosen SMS provider:
# - API: Add your API key
# - Gateway: Install Android app and set IP
# - Modem: Connect GSM modem and set COM port

# 4. Start application
npm start

# 5. Open browser
http://localhost:3000

# 6. Register unlimited phone numbers!
```

## 🎉 What's New in v1.0.0

- ✅ **FIXED**: All dependency installation issues
- 🚀 **NEW**: Unlimited phone registration
- 📱 **NEW**: Mass registration (up to 10,000 numbers)
- 📊 **NEW**: Real-time statistics and monitoring
- ⚡ **NEW**: Live progress tracking
- 🔧 **IMPROVED**: Modern serialport implementation
- 🔀 **NEW**: Modular SMS system with multiple providers
- 📱 **NEW**: Android Gateway integration
- 🌐 **NEW**: SMS API provider support
- 🔄 **NEW**: Automatic failover between SMS providers

---

## 👨‍💻 About the Developer

**MARWEN RABAI** is a skilled software developer specializing in Node.js applications, SMS systems, and authentication solutions. With expertise in creating scalable, secure, and user-friendly applications, Marwen has developed Aegis Local Auth to provide a complete self-sovereign authentication system.

### 🌐 Connect with Marwen:
- **Portfolio**: [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Specializations**: Node.js, SMS Integration, Authentication Systems, Real-time Applications
- **Technologies**: JavaScript, Express.js, SQLite, Serial Communication, WebSockets

### 🛠️ Development Philosophy:
- **Self-Sovereign Solutions**: Complete control over your data and infrastructure
- **Modular Architecture**: Flexible, extensible, and maintainable code
- **User-Centric Design**: Intuitive interfaces with real-time feedback
- **Enterprise-Ready**: Scalable solutions for businesses of all sizes

---

## 📞 Professional Services

Need customization or professional implementation of Aegis Local Auth? Marwen offers:

- **Custom SMS Integration**: Integration with specific SMS providers
- **Enterprise Deployment**: Large-scale implementation and optimization
- **Custom Features**: Tailored functionality for your specific needs
- **Technical Support**: Ongoing maintenance and support services

Contact via: [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or report issues.

### How to Contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Support

For technical support, bug reports, or feature requests:
- Create an issue on GitHub
- Visit: [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

---

**Made with ❤️ by [MARWEN RABAI](https://marwenrabai.strtikingly.com)**

---

**🛡️ Aegis Local Auth** - Your unlimited fortress of self-sovereign identity verification 

## 📚 Documentation Complète

- **README.md** : Guide principal
- **QUICK_START.md** : Démarrage rapide en 5 minutes
- **DOCUMENTATION_COMPLETE.md** : Documentation technique complète
- **WINDOWS_SETUP.md** : Guide spécifique Windows
- **API_REFERENCE.md** : Référence API complète
- **DEPLOYMENT.md** : Guide de déploiement production
- **SECURITY.md** : Guide de sécurité
- **CONTRIBUTING.md** : Guide de contribution
- **CHANGELOG.md** : Historique des versions 